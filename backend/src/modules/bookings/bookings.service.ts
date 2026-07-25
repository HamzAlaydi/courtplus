import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';
import {
  FindOptionsWhere,
  Repository,
  In,
  Not,
  FindOptionsRelations,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import type {
  ParticipantRespondedEventPayload,
  ParticipantJoinedEventPayload,
  ParticipantJoinRequestSubmittedEventPayload,
  ParticipantEnteredEventPayload,
  BookingCancelledEventPayload,
  BookingCreatedEventPayload,
  BookingPaymentCompletedEventPayload,
} from './bookings.events';
import { ListBookingsDto, Sort } from './dto/list-bookings.dto';
import { Participant, ParticipantStatus } from './entities/participant.entity';
import { PaymentsService } from '../payments/payments.service';
import type { SessionUser } from '../auth/@types/session';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../payments/entities/payment.entity';
import { CourtsService } from '../courts/courts.service';
import { CourtStatus } from '../courts/entities/court.entity';
import { dayjs } from '../shared/dayjs';
import {
  BOOKING_NOT_FOUND,
  ONLY_CREATOR_CAN_CANCEL,
  PARTICIPANT_NOT_FOUND,
  ALREADY_RESPONDED,
  SLOT_ALREADY_RESERVED,
  COURT_NOT_FOUND,
  BOOKING_JOIN_APPROVAL_NOT_REQUIRED,
  ONLY_CREATOR_CAN_MANAGE,
  BOOKING_MAX_PARTICIPANTS_REACHED,
  BOOKING_GENDER_RESTRICTION,
  BOOKING_LEVEL_REQUIREMENT,
  USER_ALREADY_HAS_BOOKING_DURING_TIME,
  BOOKING_NOT_OPEN,
  BOOKING_NOT_ACTIVE,
  ONLY_CREATOR_CAN_REMOVE_PARTICIPANTS,
  CANNOT_REMOVE_BOOKING_CREATOR,
  ONLY_CREATOR_CAN_ADD_PARTICIPANTS,
  SCHEDULE_NOT_FOUND,
} from '../shared/error-codes';
import { ListBookingsResponseDto } from './dto/list-booking-response.dto';
import { UsersService } from '../users/users.service';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { UserType } from '../auth/@types/user.type';
import { BookingEventsService } from './events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserLocation } from 'src/decorators/location.decorator';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Gender } from '../users/entities/enums';
import { BookingEventType } from './entities/event.entity';
import { Review } from '../reviews/entities/review.entity';
import { BookingResponseDto } from './dto/booking-response.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { BOOKING } from './booking.constants';
import { FindOptionsSelect } from 'typeorm';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { BookingCreatedEmailProps } from 'src/emails/staff-booking-created';
import { SlotsService } from './slots.service';
import { RemindersService } from './reminders.service';
import { ParticipantsService } from './participants.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);


  private readonly BookingStatusToBookingEvent = {
    [BookingStatus.COMPLETED]: BookingEventType.ENDED,
    [BookingStatus.IN_PROGRESS]: BookingEventType.STARTED,
  };
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly eventsService: BookingEventsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    private readonly slotsService: SlotsService,
    private readonly remindersService: RemindersService,
    private readonly participantsService: ParticipantsService,
  ) { }

  @Transactional()
  async book(
    input: CreateBookingDto,
    sessionUser: SessionUser,
  ): Promise<PaymentResponseDto> {
    const { courtId, paymentType, participants, startAt, duration } = input;
    this.logger.log(
      `[BOOKING_FLOW] Initiating booking - userId: ${sessionUser.id}, courtId: ${courtId}, startAt: ${startAt}, duration: ${duration}min, paymentType: ${paymentType}`,
    );

    const court = await this.courtsService.findOne(courtId, {
      schedule: true,
      branch: true,
    });

    if (!court.schedule) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - schedule not found for courtId: ${courtId}`,
      );
      throw new BadRequestException(SCHEDULE_NOT_FOUND);
    }

    const startDate = dayjs.tz(startAt, court.schedule.timeZone).toDate();
    const endDate = dayjs
      .tz(startAt, court.schedule.timeZone)
      .add(duration, 'minutes')
      .toDate();

    this.logger.debug(
      `[BOOKING_FLOW] Slot check - courtId: ${courtId}, startDate: ${startDate.toISOString()}, endDate: ${endDate.toISOString()}, timezone: ${court.schedule.timeZone}`,
    );

    const isReservedByOther = await this.slotsService.isSlotReservedByOther(
      courtId,
      startDate,
      endDate,
      sessionUser.id,
    );

    if (isReservedByOther) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - slot already reserved by another user - courtId: ${courtId}, userId: ${sessionUser.id}`,
      );
      throw new BadRequestException(SLOT_ALREADY_RESERVED);
    }

    const { available, reason, details } = await this.slotsService.checkSlotAvailability(
      startDate,
      endDate,
      court.schedule
    );

    if (!available) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - ${reason} - courtId: ${courtId}, startDate: ${startDate.toISOString()}, details: ${JSON.stringify(details)}`,
      );
      throw new BadRequestException(reason);
    }

    const reserved = await this.slotsService.reserveSlot(courtId, startDate, endDate, sessionUser.id);
    if (!reserved) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - could not reserve slot - courtId: ${courtId}, userId: ${sessionUser.id}`,
      );
      throw new BadRequestException(SLOT_ALREADY_RESERVED);
    }

    this.logger.log(
      `[BOOKING_FLOW] Slot reserved - courtId: ${courtId}, userId: ${sessionUser.id}`,
    );

    const bookingAmount =
      court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR);

    const paymentInfo: Partial<Payment> = {
      amount: bookingAmount,
      currency: court.currency,
      data: input,
    };
    if (paymentType === PaymentType.SPLIT) {
      const playerAmount = bookingAmount / (participants.length + 1);
      const holdAmount = bookingAmount - playerAmount;
      paymentInfo.amount = playerAmount;
      paymentInfo.holdAmount = holdAmount;
      this.logger.debug(
        `[BOOKING_FLOW] Split payment calculated - totalAmount: ${bookingAmount}, playerAmount: ${playerAmount}, holdAmount: ${holdAmount}, participantCount: ${participants.length + 1}`,
      );
    }

    const user = await this.usersService.getById(sessionUser.id, { cached: false })

    const paymentResponse = await this.paymentsService.createPaymentIntentDetails(paymentInfo, user);

    await this.paymentsService.schedulePaymentCancellation(paymentResponse.paymentId);

    this.logger.log(
      `[BOOKING_FLOW] Payment intent created - userId: ${sessionUser.id}, paymentId: ${paymentResponse.paymentId}, amount: ${bookingAmount}`,
    );

    return paymentResponse;
  }


  @Transactional()
  async create(
    {
      participants: userIds,
      paymentType,
      courtId,
      duration,
      startAt,
      open,
      payment,
      gender,
      level,
      autoAccept,
      playersASide,
    }: CreateBookingDto & {
      payment?: Payment;
    },
    user: Partial<SessionUser>,
  ): Promise<Booking> {
    this.logger.log(
      `[BOOKING_FLOW] Creating booking - userId: ${user.id}, userType: ${user.type}, courtId: ${courtId}, duration: ${duration}min, open: ${open}, paymentType: ${paymentType}`,
    );

    const court = await this.courtsService.findOne(courtId, {
      schedule: true,
      branch: true,
    });

    if (!court) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking creation failed - court not found: ${courtId}`,
      );
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    const startDate = dayjs.tz(startAt, court.schedule.timeZone).toDate();
    const endDate = dayjs
      .tz(startAt, court.schedule.timeZone)
      .add(duration, 'minutes')
      .toDate();

    this.logger.debug(
      `[BOOKING_FLOW] Checking slot availability with lock - courtId: ${courtId}, startDate: ${startDate.toISOString()}, endDate: ${endDate.toISOString()}`,
    );

    const { available, reason, details } = await this.slotsService.checkSlotAvailability(
      startDate,
      endDate,
      court.schedule,
      { lock: true },
    );

    if (!available) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking creation failed - ${reason} - courtId: ${courtId}, startDate: ${startDate.toISOString()}, details: ${JSON.stringify(details)}`,
      );
      throw new BadRequestException(reason);
    }

    const bookingAmount =
      court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR);

    const booking = new Booking();
    booking.userId = user.type === UserType.Customer ? user.id : null;
    booking.staffId = user.type === UserType.Staff ? user.id : null;
    booking.paymentType = paymentType;
    booking.courtId = courtId;
    booking.duration = duration;
    booking.startDate = startDate;
    booking.endDate = endDate;
    booking.totalAmount = bookingAmount;
    booking.open = open;
    booking.hourlyRate = court.hourlyRate;
    booking.currency = court.currency;
    booking.autoAccept = autoAccept;
    if (open) {
      booking.gender = gender;
      booking.level = level;
      booking.playersASide = playersASide;
    }

    booking.status = BookingStatus.PENDING;
    booking.paymentStatus =
      paymentType === PaymentType.WHOLE || user.type === UserType.Staff
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PENDING;
    await this.bookingsRepository.save(booking);

    this.logger.log(
      `[BOOKING_FLOW] Booking created - bookingId: ${booking.id}, status: ${booking.status}, paymentStatus: ${booking.paymentStatus}, totalAmount: ${bookingAmount}`,
    );

    const participants = await this.participantsService.createParticipants(
      userIds,
      {
        bookingId: booking.id,
        creatorPaymentId: payment?.id,
      },
      user,
    );

    this.logger.debug(
      `[BOOKING_FLOW] Participants created - bookingId: ${booking.id}, participantCount: ${participants.length}`,
    );

    booking.participants = participants;
    booking.court = court;

    if (user.type === UserType.Customer) {
      const customer = await this.usersService.getById(user.id, { cached: false })
      if (customer) {
        booking.user = customer;
      }
    }

    if (user.id) {
      await this.slotsService.releaseSlotReservation(courtId, startDate, endDate, user.id);
      this.logger.debug(
        `[BOOKING_FLOW] Slot reservation released - courtId: ${courtId}, userId: ${user.id}`,
      );
    }

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BookingEventType.CREATED, {
        booking,
      });
    });

    this.logger.log(
      `[BOOKING_FLOW] Booking creation complete - bookingId: ${booking.id}, courtId: ${courtId}, userId: ${user.id}`,
    );

    return booking;
  }

  @Transactional()
  async processParticipantPayment(payment: Payment) {
    const data = payment.data as CreateBookingDto | undefined;
    const { bookingId, userId } = payment;

    this.logger.log(
      `[BOOKING_FLOW] Processing participant payment - paymentId: ${payment.id}, userId: ${userId}, bookingId: ${bookingId || 'new'}`,
    );

    if (!bookingId) {
      this.logger.log(
        `[BOOKING_FLOW] Creating new booking from payment - paymentId: ${payment.id}, userId: ${payment.userId}`,
      );
      await this.paymentsService.removePaymentCancellation(payment.id);
      const booking = await this.create(
        {
          ...data,
          payment,
        },
        {
          id: payment.userId,
          type: UserType.Customer,
        },
      );
      payment.bookingId = booking.id;

      if (data?.paymentType === PaymentType.WHOLE) {
        payment.status = PaymentStatus.COMPLETED;
      } else {
        payment.status = PaymentStatus.HOLD;
      }

      await this.paymentsService.save(payment);
      await this.bookingsRepository.update(booking.id, {
        paymentStatus: data?.paymentType === PaymentType.WHOLE
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PARTIALLY_PAID,
      });

      this.logger.log(
        `[BOOKING_FLOW] Booking created from payment - bookingId: ${booking.id}, paymentStatus: ${payment.status}`,
      );
    } else {
      const booking = await this.findOne({ id: bookingId });
      if (!booking) {
        this.logger.warn(
          `[BOOKING_FLOW] Payment processing failed - booking not found: ${bookingId}`,
        );
        throw new NotFoundException(BOOKING_NOT_FOUND);
      }

      const participant = await this.participantsService.getParticipant(bookingId, userId);

      if (!participant) {
        this.logger.warn(
          `[BOOKING_FLOW] Payment processing failed - participant not found - bookingId: ${bookingId}, userId: ${userId}`,
        );
        throw new NotFoundException(PARTICIPANT_NOT_FOUND);
      }

      payment.status = PaymentStatus.COMPLETED;
      this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.READY);
      participant.payment = payment;
      await this.participantsService.save(participant);

      this.logger.log(
        `[BOOKING_FLOW] Participant payment completed - bookingId: ${bookingId}, userId: ${userId}, participantStatus: ${participant.status}`,
      );

      const freshParticipants = await this.participantsService.getParticipants(bookingId);
      const creator = freshParticipants.find((p) => p.isCreator);
      const nonCreatorParticipants = freshParticipants.filter((p) => !p.isCreator);

      const allNonCreatorsPaid = nonCreatorParticipants.every(
        (p) => p.status === ParticipantStatus.READY && p.payment?.status === PaymentStatus.COMPLETED,
      );

      if (allNonCreatorsPaid && creator?.payment?.status === PaymentStatus.HOLD) {
        this.logger.log(
          `[BOOKING_FLOW] All participants paid - releasing creator hold - bookingId: ${bookingId}, creatorPaymentId: ${creator.payment.id}`,
        );
        await this.paymentsService.release(creator.payment.id);
        creator.payment.status = PaymentStatus.RELEASED;
      }

      const isAllParticipantsPaid = freshParticipants.every(
        (p) =>
          p.status === ParticipantStatus.READY &&
          (p.payment?.status === PaymentStatus.COMPLETED || p.payment?.status === PaymentStatus.RELEASED),
      );

      if (isAllParticipantsPaid && booking.paymentStatus !== PaymentStatus.COMPLETED) {
        booking.paymentStatus = PaymentStatus.COMPLETED;
        await this.bookingsRepository.save(booking);

        this.logger.log(
          `[BOOKING_FLOW] Booking payment completed - bookingId: ${bookingId}, totalParticipants: ${freshParticipants.length}`,
        );

        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PAYMENT_COMPLETED, {
            booking,
          });
        });
      }

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_PAYMENT_COMPLETED, {
          booking,
          userId,
        } satisfies BookingPaymentCompletedEventPayload);
      });
    }
  }

  async findByIds(
    ids: string[],
    select?: FindOptionsSelect<Booking>,
  ): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: {
        id: In(ids),
      },
      select,
    });
  }

  async find(
    {
      courtId,
      page = 1,
      pageSize = 10,
      userId,
      open,
      status,
      startDate,
      endDate,
      radius,
      lng,
      lat,
      sortBy,
      sortDirection,
      id,
      gender,
      level,
      playersASide,
      sport,
      branchId,
      isLookingForOpenBookings = false,
    }: ListBookingsDto & { id?: string, isLookingForOpenBookings?: boolean },
    user: SessionUser,
    location?: UserLocation,
  ): Promise<ListBookingsResponseDto> {
    const openBookings = isLookingForOpenBookings || open;
    const isBookings = user.type === UserType.Customer && !isLookingForOpenBookings;
    const qb = this.bookingsRepository.createQueryBuilder('booking');
    if (isBookings) {
      qb.innerJoin(
        Participant,
        'userParticipant',
        'userParticipant.bookingId = booking.id AND userParticipant.userId = :userId',
        { userId: user.id },
      );
      qb.leftJoinAndMapOne(
        'booking.review',
        Review,
        'review',
        'review.bookingId = booking.id AND review.userId = :userId',
        { userId: user.id },
      );
    }
    qb.innerJoinAndMapMany(
      'booking.participants',
      Participant,
      'participant',
      `participant.bookingId = booking.id`,
    )
      .leftJoinAndSelect('participant.user', 'user')
      .leftJoinAndSelect('booking.court', 'court')
      .leftJoinAndSelect('court.branch', 'branch')
      .leftJoinAndSelect('court.location', 'location')
      .leftJoinAndSelect('branch.location', 'branchLocation')
      .leftJoinAndMapMany(
        'court.assets',
        Asset,
        'assets',
        'assets.resourceId = court.id',
      )
      .select([
        'booking',
        'participant',
        'user.firstName',
        'user.lastName',
        'user.avatarUrl',
        'user.username',
        'user.email',
        'court.id',
        'court.name',
        'court.hourlyRate',
        'court.avgRating',
        'court.status',
        'court.sport',
        'branch.id',
        'branch.name',
        'branch.tenantId',
        'location.id',
        'location.name',
        'location.placeId',
        'location.address',
        'location.coordinates',
        'branchLocation.id',
        'branchLocation.name',
        'branchLocation.placeId',
        'branchLocation.address',
        'branchLocation.coordinates',
        'assets.id',
        'assets.mimeType',
        'assets.type',
        'assets.fileSize',
        'assets.position',
      ]);

    if (isBookings) {
      qb.addSelect([
        'review.id',
        'review.rating',
        'review.comment',
        'review.createdAt',
      ]);
    }
    if (user.type === UserType.Staff) {
      qb.andWhere('branch.tenantId = :tenantId', { tenantId: user.tenantId });
    }

    if (user.type === UserType.Customer && isLookingForOpenBookings) {
      // Customer-facing visibility: hide open bookings on non-available
      // courts, suspended branches and blocked tenants.
      qb.leftJoin('branch.tenant', 'tenant');
      qb.andWhere('court.status = :visibleCourtStatus', {
        visibleCourtStatus: CourtStatus.AVAILABLE,
      });
      qb.andWhere('branch.suspendedAt IS NULL');
      qb.andWhere('tenant.blockedAt IS NULL');
    }
    if (id) {
      qb.andWhere('booking.id = :id', { id });
    }

    if (courtId) {
      qb.andWhere('booking.courtId = :courtId', { courtId });
    }

    if (openBookings) {
      qb.andWhere('booking.open = :open', { open: openBookings });
    }

    if (status && status.length > 0) {
      qb.andWhere('booking.status IN (:...status)', { status });
    }

    if (gender) {
      qb.andWhere('booking.gender = :gender', { gender });
    }

    if (level) {
      qb.andWhere('booking.level = :level', { level });
    }

    if (playersASide) {
      qb.andWhere('booking.playersASide = :playersASide', { playersASide });
    }

    if (sport) {
      qb.andWhere('court.sport = :sport', { sport });
    }

    if (branchId) {
      qb.andWhere('branch.id = :branchId', { branchId });
    }

    if (startDate) {
      qb.andWhere('booking.startDate >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('booking.endDate <= :endDate', { endDate });
    }

    if (userId && user.type === UserType.Staff) {
      qb.andWhere(
        '(booking.userId = :userId OR participant.userId = :userId AND branch.tenantId = :tenantId)',
        { userId, tenantId: user.tenantId },
      );
    }

    if (lng && lat) {
      qb.andWhere(
        `ST_DWithin(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), ${BOOKING.SRID_WGS84})::geography,
          :radius
        )`,
        {
          longitude: lng,
          latitude: lat,
          radius,
        },
      );
      qb.addSelect(
        `ST_Distance(
          location.coordinates::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), ${BOOKING.SRID_WGS84})::geography
        )`,
        'distance',
      );

      qb.orderBy('distance', 'ASC');
    }

    if (sortBy) {
      switch (sortBy) {
        case Sort.START_DATE:
          qb.orderBy('booking.startDate', sortDirection);
          break;
        case Sort.END_DATE:
          qb.orderBy('booking.endDate', sortDirection);
          break;
        case Sort.CREATED_AT:
          qb.orderBy('booking.createdAt', sortDirection);
          break;
      }
    }

    const [bookings, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount()

    const courts = bookings.map((booking) => booking.court);
    const mappedCourts = await this.courtsService.mapCourts(
      courts,
      { include: { branch: true, bookmarks: user.type === UserType.Customer } },
      user,
      location,
    );

    const mappedBookings = bookings.map((booking) => ({
      ...booking,
      court: mappedCourts.find((court) => court.id === booking.court.id),
    }));

    return {
      items: mappedBookings,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  findOne(
    where: FindOptionsWhere<Booking>,
    relations: FindOptionsRelations<Booking> = {
      participants: {
        payment: true,
      },
    },
  ): Promise<Booking | null> {
    const booking = this.bookingsRepository.findOne({
      where,
      relations,
    });
    return booking;
  }

  async getOne(id: string, user: SessionUser): Promise<Booking | null> {
    const booking = await this.find({ id }, user);
    return booking.items.length > 0 ? booking.items[0] : null;
  }
  @Transactional()
  async cancel(id: string, user: SessionUser, cancellationReason?: string): Promise<void> {
    this.logger.log(
      `[BOOKING_FLOW] Initiating cancellation - bookingId: ${id}, userId: ${user.id}, userType: ${user.type}`,
    );

    const booking = await this.bookingsRepository.findOne({
      where: {
        id,
      },
      relations: {
        participants: {
          payment: true,
          user: true,
        },
        court: {
          branch: true,
          schedule: true,
        },
        user: true,
      },
    });

    if (!booking) {
      this.logger.warn(
        `[BOOKING_FLOW] Cancellation failed - booking not found: ${id}`,
      );
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }

    if (booking.status === BookingStatus.CANCELLED) {
      this.logger.log(
        `[BOOKING_FLOW] Cancellation skipped - already cancelled: ${id}`,
      );
      return;
    }

    const creator = booking.participants.find(
      (participant) => participant.isCreator,
    );

    const isCreator = creator?.userId === user.id;
    const isStaff = user.type === UserType.Staff;
    const participant = booking.participants.find((p) => p.userId === user.id);

    this.logger.debug(
      `[BOOKING_FLOW] Cancellation context - bookingId: ${id}, isCreator: ${isCreator}, isStaff: ${isStaff}, currentStatus: ${booking.status}`,
    );

    if (isCreator || isStaff) {
      this.logger.log(
        `[BOOKING_FLOW] Full booking cancellation by ${isStaff ? 'staff' : 'creator'} - bookingId: ${id}`,
      );

      if (booking.paymentType === PaymentType.SPLIT) {
        for (const participant of booking.participants) {
          if (!participant.payment) {
            continue;
          }
          if (participant.payment.status === PaymentStatus.COMPLETED) {
            this.logger.log(
              `[BOOKING_FLOW] Refunding participant - bookingId: ${id}, participantUserId: ${participant.userId}, paymentId: ${participant.payment.id}`,
            );
            await this.paymentsService.refund(participant.payment.id);
          } else if (participant.payment.status === PaymentStatus.HOLD) {
            this.logger.log(
              `[BOOKING_FLOW] Releasing participant hold - bookingId: ${id}, participantUserId: ${participant.userId}, paymentId: ${participant.payment.id}`,
            );
            await this.paymentsService.release(participant.payment.id);
          }
        }
      } else if (booking.paymentType === PaymentType.WHOLE) {
        if (creator?.payment) {
          if (creator.payment.status === PaymentStatus.COMPLETED) {
            this.logger.log(
              `[BOOKING_FLOW] Refunding creator - bookingId: ${id}, paymentId: ${creator.payment.id}`,
            );
            await this.paymentsService.refund(creator.payment.id);
          } else if (creator.payment.status === PaymentStatus.HOLD) {
            this.logger.log(
              `[BOOKING_FLOW] Releasing creator hold - bookingId: ${id}, paymentId: ${creator.payment.id}`,
            );
            await this.paymentsService.release(creator.payment.id);
          }
        }
      }

      await this.bookingsRepository.update(id, {
        status: BookingStatus.CANCELLED,
      });

      this.logger.log(
        `[BOOKING_FLOW] Booking cancelled - bookingId: ${id}, cancelledBy: ${user.id}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.CANCELLED, {
          booking,
        });
      });
    } else if (participant) {
      this.logger.log(
        `[BOOKING_FLOW] Participant leaving booking - bookingId: ${id}, userId: ${user.id}`,
      );

      if (
        booking.status === BookingStatus.COMPLETED ||
        booking.status === BookingStatus.IN_PROGRESS
      ) {
        this.logger.warn(
          `[BOOKING_FLOW] Participant leave failed - booking not active - bookingId: ${id}, status: ${booking.status}`,
        );
        throw new BadRequestException(BOOKING_NOT_ACTIVE);
      }

      if (participant.payment) {
        if (participant.payment.status === PaymentStatus.COMPLETED) {
          this.logger.log(
            `[BOOKING_FLOW] Refunding leaving participant - bookingId: ${id}, userId: ${user.id}, paymentId: ${participant.payment.id}`,
          );
          await this.paymentsService.refund(participant.payment.id);
        } else if (participant.payment.status === PaymentStatus.HOLD) {
          this.logger.log(
            `[BOOKING_FLOW] Releasing leaving participant hold - bookingId: ${id}, userId: ${user.id}, paymentId: ${participant.payment.id}`,
          );
          await this.paymentsService.release(participant.payment.id);
        } else if (participant.payment.status === PaymentStatus.PENDING) {
          this.logger.log(
            `[BOOKING_FLOW] Cancelling leaving participant payment - bookingId: ${id}, userId: ${user.id}, paymentId: ${participant.payment.id}`,
          );
          await this.paymentsService.cancelPayment(participant.payment.id);
        }
      }

      this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.CANCELLED);
      participant.cancellationReason = cancellationReason;
      participant.booking = booking;
      await this.participantsService.save(participant);

      this.logger.log(
        `[BOOKING_FLOW] Participant left booking - bookingId: ${id}, userId: ${user.id}, reason: ${cancellationReason || 'not provided'}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_CANCELLED, {
          participant,
        });
      });
    } else {
      this.logger.warn(
        `[BOOKING_FLOW] Cancellation denied - user not authorized - bookingId: ${id}, userId: ${user.id}`,
      );
      throw new ForbiddenException(ONLY_CREATOR_CAN_CANCEL);
    }
  }

  @Transactional()
  async removeParticipants(bookingId: string, userIds: string[], user: SessionUser): Promise<void> {
    this.logger.log(
      `[BOOKING_FLOW] Removing participants - bookingId: ${bookingId}, removedBy: ${user.id}, userIds: [${userIds.join(', ')}]`,
    );

    const creatorParticipant = await this.participantsService.getParticipant(bookingId, user.id);
    if (!creatorParticipant || !creatorParticipant.isCreator) {
      this.logger.warn(
        `[BOOKING_FLOW] Remove participants failed - not creator - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new ForbiddenException(ONLY_CREATOR_CAN_REMOVE_PARTICIPANTS);
    }

    const booking = creatorParticipant.booking;
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      this.logger.warn(
        `[BOOKING_FLOW] Remove participants failed - booking not active - bookingId: ${bookingId}, status: ${booking.status}`,
      );
      throw new BadRequestException(BOOKING_NOT_ACTIVE);
    }

    for (const userId of userIds) {
      const participant = await this.participantsService.getParticipant(bookingId, userId);
      if (!participant) {
        this.logger.warn(
          `[BOOKING_FLOW] Remove participant failed - participant not found - bookingId: ${bookingId}, userId: ${userId}`,
        );
        throw new NotFoundException(PARTICIPANT_NOT_FOUND);
      }

      if (participant.isCreator) {
        this.logger.warn(
          `[BOOKING_FLOW] Remove participant failed - cannot remove creator - bookingId: ${bookingId}`,
        );
        throw new BadRequestException(CANNOT_REMOVE_BOOKING_CREATOR);
      }

      if (participant.paymentId) {
        this.logger.log(
          `[BOOKING_FLOW] Refunding removed participant - bookingId: ${bookingId}, userId: ${userId}, paymentId: ${participant.paymentId}`,
        );
        await this.paymentsService.refund(participant.paymentId);
      }

      const participantCopy = { ...participant };
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_REMOVED, {
          participant: participantCopy,
          removedBy: user.id,
        });
      });

      await this.participantsService.delete(participant.id);
      this.logger.log(
        `[BOOKING_FLOW] Participant removed - bookingId: ${bookingId}, userId: ${userId}`,
      );
    }
  }

  @Transactional()
  async addParticipants(bookingId: string, userIds: string[], user: SessionUser): Promise<void> {
    this.logger.log(
      `[BOOKING_FLOW] Adding participants - bookingId: ${bookingId}, addedBy: ${user.id}, userIds: [${userIds.join(', ')}]`,
    );

    const creatorParticipant = await this.participantsService.getParticipant(bookingId, user.id);
    if (!creatorParticipant || !creatorParticipant.isCreator) {
      this.logger.warn(
        `[BOOKING_FLOW] Add participants failed - not creator - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new ForbiddenException(ONLY_CREATOR_CAN_ADD_PARTICIPANTS);
    }

    const booking = creatorParticipant.booking;
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      this.logger.warn(
        `[BOOKING_FLOW] Add participants failed - booking not active - bookingId: ${bookingId}, status: ${booking.status}`,
      );
      throw new BadRequestException(BOOKING_NOT_ACTIVE);
    }

    const existingParticipants = await this.participantsService.getParticipants(bookingId);

    const activeParticipantCount = existingParticipants.filter(
      (p) =>
        p.status === ParticipantStatus.READY ||
        p.status === ParticipantStatus.ENTERED ||
        p.status === ParticipantStatus.PENDING_APPROVAL ||
        p.status === ParticipantStatus.PENDING_PAYMENT ||
        p.status === ParticipantStatus.PENDING_RESPONSE,
    ).length;

    const newUserIds = userIds.filter(
      (userId) => !existingParticipants.find((p) => p.userId === userId),
    );

    this.logger.debug(
      `[BOOKING_FLOW] Add participants check - bookingId: ${bookingId}, activeCount: ${activeParticipantCount}, newCount: ${newUserIds.length}, maxAllowed: ${BOOKING.MAX_PARTICIPANTS_PER_BOOKING}`,
    );

    if (activeParticipantCount + newUserIds.length > BOOKING.MAX_PARTICIPANTS_PER_BOOKING) {
      this.logger.warn(
        `[BOOKING_FLOW] Add participants failed - max reached - bookingId: ${bookingId}, current: ${activeParticipantCount}, requested: ${newUserIds.length}`,
      );
      throw new BadRequestException(BOOKING_MAX_PARTICIPANTS_REACHED);
    }

    for (const userId of newUserIds) {
      const participant = await this.participantsService.create({
        bookingId,
        userId,
        status: ParticipantStatus.PENDING_RESPONSE,
        isCreator: false
      });

      participant.booking = booking;

      this.logger.log(
        `[BOOKING_FLOW] Participant added - bookingId: ${bookingId}, userId: ${userId}, participantId: ${participant.id}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_ADDED, {
          participant,
          addedBy: user.id,
        });
      });
    }
  }

  async pay(participant: Participant): Promise<PaymentResponseDto> {
    const { booking, user } = participant;

    const amount =
      (booking.hourlyRate * (booking.duration / BOOKING.MINUTES_PER_HOUR)) /
      booking.participants.length;
    return this.paymentsService.createPaymentIntentDetails(
      { amount, bookingId: booking.id, currency: booking.currency },
      user,
    );
  }
  @Transactional()
  async respondToJoinRequest(
    bookingId: string,
    data: JoinRequestDto,
    user: SessionUser,
  ) {
    const { accept, participantId, rejectionReason } = data;

    this.logger.log(
      `[BOOKING_FLOW] Responding to join request - bookingId: ${bookingId}, creatorId: ${user.id}, participantId: ${participantId}, accept: ${accept}`,
    );

    const [creatorParticipant, participant] = await Promise.all([
      this.participantsService.getParticipant(bookingId, user.id),
      this.participantsService.getParticipant(bookingId, participantId),
    ]);

    if (!creatorParticipant) {
      this.logger.warn(
        `[BOOKING_FLOW] Join request response failed - creator not found - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new NotFoundException(PARTICIPANT_NOT_FOUND);
    }

    if (!participant) {
      this.logger.warn(
        `[BOOKING_FLOW] Join request response failed - participant not found - bookingId: ${bookingId}, participantId: ${participantId}`,
      );
      throw new NotFoundException(PARTICIPANT_NOT_FOUND);
    }

    const booking = creatorParticipant.booking;

    if (!booking) {
      this.logger.warn(
        `[BOOKING_FLOW] Join request response failed - booking not found: ${bookingId}`,
      );
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }

    if (booking.userId !== user.id) {
      this.logger.warn(
        `[BOOKING_FLOW] Join request response denied - not creator - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new ForbiddenException(ONLY_CREATOR_CAN_MANAGE);
    }

    if (booking.autoAccept || !booking.open) {
      this.logger.warn(
        `[BOOKING_FLOW] Join request response failed - approval not required - bookingId: ${bookingId}, autoAccept: ${booking.autoAccept}, open: ${booking.open}`,
      );
      throw new BadRequestException(BOOKING_JOIN_APPROVAL_NOT_REQUIRED);
    }

    if (accept) {
      const newStatus = booking.paymentType === PaymentType.WHOLE ? ParticipantStatus.READY : ParticipantStatus.PENDING_PAYMENT;
      const result = await this.participantsService.update(
        { id: participant.id },
        { status: newStatus },
      );
      if (result.affected === 0) {
        throw new NotFoundException(PARTICIPANT_NOT_FOUND);
      }

      this.logger.log(
        `[BOOKING_FLOW] Join request approved - bookingId: ${bookingId}, participantUserId: ${participantId}, newStatus: ${newStatus}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_JOIN_REQUEST_APPROVED, {
          participant,
          userId: user.id,
        } satisfies ParticipantRespondedEventPayload);
      });
    } else {
      const participantCopy = { ...participant };
      await this.participantsService.delete(participant.id);

      this.logger.log(
        `[BOOKING_FLOW] Join request rejected - bookingId: ${bookingId}, participantUserId: ${participantId}, reason: ${rejectionReason || 'not provided'}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_JOIN_REQUEST_REJECTED, {
          participant: participantCopy,
          userId: user.id,
          rejectionReason,
        } satisfies ParticipantRespondedEventPayload);
      });
    }

  }
  @Transactional()
  async respondToBookingInvitation(
    bookingId: string,
    data: BookingResponseDto,
    user: SessionUser,
  ): Promise<PaymentResponseDto | void> {
    const { accept } = data;

    this.logger.log(
      `[BOOKING_FLOW] Responding to booking invitation - bookingId: ${bookingId}, userId: ${user.id}, accept: ${accept}`,
    );

    const participants = await this.participantsService.getParticipants(bookingId);
    const participant = participants.find(p => p.userId === user.id);

    if (!participant) {
      this.logger.warn(
        `[BOOKING_FLOW] Invitation response failed - participant not found - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new NotFoundException(PARTICIPANT_NOT_FOUND);
    }

    if (!participant.booking) {
      this.logger.warn(
        `[BOOKING_FLOW] Invitation response failed - booking not found: ${bookingId}`,
      );
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }

    participant.booking.participants = participants;

    if (participant.status === ParticipantStatus.READY) {
      this.logger.warn(
        `[BOOKING_FLOW] Invitation response failed - already responded - bookingId: ${bookingId}, userId: ${user.id}, currentStatus: ${participant.status}`,
      );
      throw new ForbiddenException(ALREADY_RESPONDED);
    }

    if (accept) {
      const newStatus = participant.booking.paymentType === PaymentType.WHOLE ? ParticipantStatus.READY : ParticipantStatus.PENDING_PAYMENT;
      const result = await this.participantsService.update(
        { id: participant.id },
        { status: newStatus },
      );
      if (result.affected === 0) {
        throw new NotFoundException(PARTICIPANT_NOT_FOUND);
      }

      this.logger.log(
        `[BOOKING_FLOW] Invitation accepted - bookingId: ${bookingId}, userId: ${user.id}, newStatus: ${newStatus}`,
      );

      if (participant.booking.paymentType === PaymentType.SPLIT) {
        this.logger.debug(
          `[BOOKING_FLOW] Generating payment for accepted invitation - bookingId: ${bookingId}, userId: ${user.id}`,
        );
        return this.pay(participant);
      }

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_INVITATION_ACCEPTED, {
          participant,
          userId: user.id,
        } satisfies ParticipantRespondedEventPayload);
      });
    } else {
      this.logger.log(
        `[BOOKING_FLOW] Invitation rejected - bookingId: ${bookingId}, userId: ${user.id}, reason: ${data.rejectionReason || 'not provided'}`,
      );

      const participantCopy = { ...participant };
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PARTICIPANT_INVITATION_REJECTED, {
          userId: user.id,
          participant: participantCopy,
          rejectionReason: data.rejectionReason,
        } satisfies ParticipantRespondedEventPayload);
      });

      await this.participantsService.delete(participant.id);
    }
  }

  @Transactional()
  async enterBooking(bookingId: string, user: SessionUser): Promise<void> {
    this.logger.log(
      `[BOOKING_FLOW] Entering booking - bookingId: ${bookingId}, userId: ${user.id}`,
    );

    const participant = await this.participantsService.getParticipant(bookingId, user.id);

    if (!participant) {
      this.logger.warn(
        `[BOOKING_FLOW] Enter booking failed - participant not found - bookingId: ${bookingId}, userId: ${user.id}`,
      );
      throw new ForbiddenException(PARTICIPANT_NOT_FOUND);
    }

    if (!participant.booking) {
      this.logger.warn(
        `[BOOKING_FLOW] Enter booking failed - booking not found: ${bookingId}`,
      );
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }

    this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.ENTERED);
    await this.participantsService.save(participant);

    this.logger.log(
      `[BOOKING_FLOW] Participant entered booking - bookingId: ${bookingId}, userId: ${user.id}, newStatus: ${participant.status}`,
    );

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(BookingEventType.PARTICIPANT_ENTERED, {
        participant,
      } satisfies ParticipantEnteredEventPayload);
    });
  }

  async notifyParticipants(
    bookingId: string,
    type: NotificationType,
    data?: any,
    exceptUserIds?: string[],
    emailData?: Record<string, any>,
  ): Promise<void> {
    const whereCondition = exceptUserIds?.length
      ? { userId: Not(In(exceptUserIds)) }
      : {};

    const participants = await this.participantsService.getParticipants(bookingId, {}, whereCondition);

    const userIds = participants.map((participant) => participant.userId);

    if (userIds.length === 0) {
      return;
    }

    await this.notificationsService.sendNotification(userIds, {
      type,
      data,
      resourceId: bookingId,
      emailData,
    });
  }

  async notifyStaffBookingReminder(
    booking: Booking,
    reminderTime: string,
    emailData: Record<string, any>,
  ): Promise<void> {
    if (!booking.court?.branch?.id) {
      return;
    }
    await this.notificationsService.notifyStaff(
      { branchId: booking.court.branch.id },
      {
        type: NotificationType.BOOKING_REMINDER,
        data: {
          bookingId: booking.id,
          courtId: booking.courtId,
          court: booking.court.name,
          courtName: booking.court.name,
          time: reminderTime,
        },
        resourceId: booking.id,
        emailData,
      },
    );
  }


  @Transactional()
  async joinBooking(
    bookingId: string,
    sessionUser: SessionUser,
  ): Promise<PaymentResponseDto | void> {
    this.logger.log(
      `[BOOKING_FLOW] Joining open booking - bookingId: ${bookingId}, userId: ${sessionUser.id}`,
    );

    try {
      const booking = await this.bookingsRepository
        .createQueryBuilder('booking')
        .setLock('pessimistic_write', undefined, ['booking'])
        .leftJoinAndSelect('booking.court', 'court')
        .leftJoinAndSelect('court.branch', 'branch')
        .leftJoinAndSelect('court.schedule', 'schedule')
        .leftJoinAndSelect('booking.participants', 'participants')
        .where('booking.id = :bookingId', { bookingId })
        .getOne();

      if (!booking) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - booking not found: ${bookingId}`,
        );
        throw new NotFoundException(BOOKING_NOT_FOUND);
      }

      if (!booking.open) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - booking not open: ${bookingId}`,
        );
        throw new ForbiddenException(BOOKING_NOT_OPEN);
      }

      const overlappingBookings = await this.bookingsRepository
        .createQueryBuilder('booking')
        .leftJoin('booking.participants', 'participant')
        .where(
          '(participant.userId = :userId OR booking.userId = :userId)',
          { userId: sessionUser.id },
        )
        .andWhere('booking.status != :cancelledStatus', {
          cancelledStatus: BookingStatus.CANCELLED,
        })
        .andWhere('booking.startDate < :endDate', {
          endDate: booking.endDate,
        })
        .andWhere('booking.endDate > :startDate', {
          startDate: booking.startDate,
        })
        .getCount();

      if (overlappingBookings > 0) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - user has overlapping booking - bookingId: ${bookingId}, userId: ${sessionUser.id}`,
        );
        throw new BadRequestException(USER_ALREADY_HAS_BOOKING_DURING_TIME);
      }

      const user = await this.usersService.getById(sessionUser.id, { cached: false, relations: ['sports'] });

      if (
        !user.gender ||
        (booking.gender === Gender.MALE && user.gender !== Gender.MALE) ||
        (booking.gender === Gender.FEMALE && user.gender !== Gender.FEMALE)
      ) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - gender restriction - bookingId: ${bookingId}, userId: ${sessionUser.id}, userGender: ${user.gender}, bookingGender: ${booking.gender}`,
        );
        throw new ForbiddenException(BOOKING_GENDER_RESTRICTION);
      }

      if (booking.level) {
        const userSport = user.sports?.find(
          (sport) => sport.name === booking.court.sport,
        );
        if (!userSport || userSport.level !== booking.level) {
          this.logger.warn(
            `[BOOKING_FLOW] Join booking failed - level requirement - bookingId: ${bookingId}, userId: ${sessionUser.id}, requiredLevel: ${booking.level}, userLevel: ${userSport?.level}`,
          );
          throw new ForbiddenException(BOOKING_LEVEL_REQUIREMENT);
        }
      }

      const participantCount = booking.participants.filter(
        (p) =>
          p.status === ParticipantStatus.READY ||
          p.status === ParticipantStatus.ENTERED ||
          p.status === ParticipantStatus.PENDING_APPROVAL ||
          p.status === ParticipantStatus.PENDING_PAYMENT,
      ).length;

      if (participantCount >= BOOKING.MAX_PARTICIPANTS_PER_BOOKING) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - max participants reached - bookingId: ${bookingId}, currentCount: ${participantCount}`,
        );
        throw new BadRequestException(BOOKING_MAX_PARTICIPANTS_REACHED);
      }

      this.logger.debug(
        `[BOOKING_FLOW] Join validation passed - bookingId: ${bookingId}, userId: ${sessionUser.id}, autoAccept: ${booking.autoAccept}, currentParticipants: ${participantCount}`,
      );

      let participant: Participant;
      if (!booking.autoAccept) {
        participant = await this.participantsService.create({
          userId: sessionUser.id,
          bookingId,
          status: ParticipantStatus.PENDING_APPROVAL,
        });

        this.logger.log(
          `[BOOKING_FLOW] Join request submitted (pending approval) - bookingId: ${bookingId}, userId: ${sessionUser.id}, participantId: ${participant.id}`,
        );

        participant.booking = booking;

        await this.eventsService.create({
          bookingId: booking.id,
          userId: participant.userId,
          event: BookingEventType.PARTICIPANT_JOIN_REQUEST_SUBMITTED,
        });

        runOnTransactionCommit(() => {
          this.eventEmitter.emit(
            BookingEventType.PARTICIPANT_JOIN_REQUEST_SUBMITTED,
            {
              participant,
              requesterName: user.fullName,
            } satisfies ParticipantJoinRequestSubmittedEventPayload,
          );
        });
      } else {
        const newStatus = booking.paymentType === PaymentType.WHOLE ? ParticipantStatus.READY : ParticipantStatus.PENDING_PAYMENT;
        participant = await this.participantsService.create({
          userId: sessionUser.id,
          bookingId,
          status: newStatus,
        });

        this.logger.log(
          `[BOOKING_FLOW] User auto-joined booking - bookingId: ${bookingId}, userId: ${sessionUser.id}, participantId: ${participant.id}, status: ${newStatus}`,
        );

        booking.participants.push(participant);
        participant.booking = booking;
        participant.user = user;

        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PARTICIPANT_JOINED, {
            participant,
          } satisfies ParticipantJoinedEventPayload);
        });

        return this.pay(participant);
      }
    } catch (error) {
      this.logger.error(`[BOOKING_FLOW] Join booking failed - error: ${error.message}`, error.stack);
      throw error;
    }
  }




  async changeBookingStatus(bookingId: string, expectedStatus: BookingStatus,
    newStatus: BookingStatus) {
    const result = await this.bookingsRepository.update({ id: bookingId, status: expectedStatus }, {
      status: newStatus,
    });
    return result.affected === 1;
  }


  @Transactional()
  async processPendingPayments(bookingId: string) {
    this.logger.log(`Processing pending payments for booking ${bookingId}`);

    try {
      const booking = await this.findOne({ id: bookingId });
      if (!booking) {
        throw new Error('Booking not found');
      }

      const participants = await this.participantsService.getParticipants(bookingId);

      const participantsWithPendingPayments = participants.filter(
        (p) => !p.payment || p.payment.status === PaymentStatus.PENDING,
      );

      if (participantsWithPendingPayments.length === 0) {
        this.logger.log('No pending payments to process');
        return null;
      }

      const creatorPayment = await this.paymentsService.findOne({
        userId: booking.userId,
        bookingId,
        status: PaymentStatus.HOLD,
      });

      if (!creatorPayment || !creatorPayment.holdAmount) {
        this.logger.warn('No held amount found for creator');
        return {
          pendingParticipants: participantsWithPendingPayments.map(
            (p) => p.userId,
          ),
          amountDeducted: 0,
          error: 'No held amount available',
        };
      }

      const totalParticipants = participants.length;
      const amountPerParticipant = booking.totalAmount / totalParticipants;
      const totalToDeduct =
        amountPerParticipant * participantsWithPendingPayments.length;

      if (creatorPayment.holdAmount < totalToDeduct) {
        this.logger.warn(
          `Insufficient held amount. Required: ${totalToDeduct}, Available: ${creatorPayment.holdAmount}`,
        );
      }

      const actualDeduction = Math.min(
        totalToDeduct,
        creatorPayment.holdAmount,
      );

      await this.paymentsService.completePayment(
        creatorPayment.id,
        actualDeduction,
      );

      for (const participant of participantsWithPendingPayments) {
        if (participant.paymentId) {
          await this.paymentsService.completePayment(
            participant.paymentId,
            amountPerParticipant,
          );
        }
      }

      this.logger.log(`Deducted ${actualDeduction} from creator's held amount`);

      return {
        pendingParticipants: participantsWithPendingPayments.map(
          (p) => p.userId,
        ),
        amountDeducted: actualDeduction,
        remainingHoldAmount: creatorPayment.holdAmount - actualDeduction,
      };
    } catch (error) {
      this.logger.error('Error processing pending payments:', error);
      return {
        error: 'Failed to process payments',
      };
    }
  }

  @OnEvent(BookingEventType.PARTICIPANT_JOIN_REQUEST_SUBMITTED)
  private async handleParticipantJoinRequestSubmitted({
    participant,
    requesterName,
  }: ParticipantJoinRequestSubmittedEventPayload) {
    const { booking } = participant;
    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    this.notificationsService.sendNotification(booking.userId, {
      type: NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED,
      data: {
        bookingId: booking.id,
        participantId: participant.id,
        userId: participant.userId,
      },
      emailData: {
        requesterName,
        courtName: booking.court?.name,
        branchName: booking.court?.branch?.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court?.sport,
        bookingId: booking.id,
      },
    });
  }

  @OnEvent(BookingEventType.PARTICIPANT_JOIN_REQUEST_APPROVED)
  private async handleParticipantRequestApproved({
    participant,
    userId,
  }: ParticipantRespondedEventPayload) {
    const { booking } = participant;
    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    const promises = []
    promises.push(
      this.eventsService.create({
        bookingId: participant.bookingId,
        userId: participant.userId,
        event: BookingEventType.PARTICIPANT_JOIN_REQUEST_APPROVED,
      }),
    );
    promises.push(this.notificationsService.sendNotification(participant.userId, {
      type: NotificationType.BOOKING_JOIN_REQUEST_APPROVED,
      data: {
        bookingId: participant.bookingId,
        userId
      },
      emailData: {
        courtName: booking.court?.name,
        branchName: booking.court?.branch?.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court?.sport,
        bookingId: participant.bookingId,
      },
    }))

    if (participant.booking.paymentType === PaymentType.WHOLE) {
      promises.push(this.notifyParticipants(participant.bookingId, NotificationType.BOOKING_JOINED, {
        participantId: participant.id,
        userId: participant.userId,
        bookingId: participant.bookingId,
        name: participant.user?.fullName || 'A player',
      }, [participant.userId]))
    }
    await Promise.allSettled(promises)
  }

  @OnEvent(BookingEventType.PARTICIPANT_JOIN_REQUEST_REJECTED)
  private async handleParticipantRequestRejected({
    participant,
    userId,
    rejectionReason,
  }: ParticipantRespondedEventPayload) {
    const { booking } = participant;
    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    await Promise.allSettled([
      this.eventsService.create({
        bookingId: participant.bookingId,
        userId: participant.userId,
        event: BookingEventType.PARTICIPANT_JOIN_REQUEST_REJECTED,
      }),
      this.notificationsService.sendNotification(participant.userId, {
        type: NotificationType.BOOKING_JOIN_REQUEST_REJECTED,
        data: {
          bookingId: participant.bookingId,
          userId
        },
        emailData: {
          courtName: booking.court?.name,
          branchName: booking.court?.branch?.name,
          date: startDateLocal.format('MMM DD, YYYY'),
          startTime: startDateLocal.format('h:mm A'),
          endTime: endDateLocal.format('h:mm A'),
          sportType: booking.court?.sport,
          rejectionReason,
        },
      }),
    ]);
  }

  @OnEvent(BookingEventType.CREATED)
  private async handleBookingCreated({ booking }: BookingCreatedEventPayload) {
    this.logger.log(
      `[BOOKING_EVENT] Handling booking created - bookingId: ${booking.id}, userId: ${booking.userId}, courtId: ${booking.courtId}`,
    );

    const promises = []

    promises.push(this.remindersService.scheduleBookingReminders(booking))

    const skippedNotifiedUsers = booking.user ? [booking.userId] : []

    const tz = booking.court.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    promises.push(this.notifyParticipants(booking.id, NotificationType.BOOKING_INVITATION, {
      bookingId: booking.id,
      name: booking.user?.fullName || 'A player',
    }, skippedNotifiedUsers, {
      inviterName: booking.user?.fullName || 'A player',
      courtName: booking.court.name,
      branchName: booking.court.branch.name,
      date: startDateLocal.format('MMM DD, YYYY'),
      startTime: startDateLocal.format('h:mm A'),
      endTime: endDateLocal.format('h:mm A'),
      sportType: booking.court.sport,
      bookingId: booking.id,
    }))

    if (booking.user) {
      promises.push(this.notificationsService.sendNotification(booking.userId, {
        type: NotificationType.BOOKING_CREATED,
        data: {
          bookingId: booking.id,
          courtId: booking.courtId,
          court: booking.court.name,
          courtName: booking.court.name,
          date: startDateLocal.format('MMM DD, YYYY'),
          startTime: startDateLocal.format('h:mm A'),
          endTime: endDateLocal.format('h:mm A'),
        },
        resourceId: booking.id,
        sendEmail: false,
      }));
      promises.push(this.notificationsService.notifyStaff(
        { tenantId: booking.court.branch.tenantId, branchId: booking.court.branch.id },
        {
          type: NotificationType.BOOKING_CREATED,
          data: {
            bookingId: booking.id,
            courtId: booking.courtId,
            court: booking.court.name,
            courtName: booking.court.name,
          },
          emailData: {
            bookingId: booking.id,
            courtName: booking.court.name,
            branchName: booking.court.branch.name,
            date: startDateLocal.format('MMM DD, YYYY'),
            startTime: startDateLocal.format('h:mm A'),
            endTime: endDateLocal.format('h:mm A'),
            numberOfPeople: booking.participants.length,
            customerName: booking.user.fullName,
            paymentStatus: booking.paymentStatus,
            paymentAmount: booking.totalAmount.toString(),
          } satisfies BookingCreatedEmailProps,
          email: true,
          resourceId: booking.id,
        },
      ))
    }
    await Promise.allSettled(promises)

  }


  @OnEvent(BookingEventType.CANCELLED)
  private async handleBookingCancelled({
    booking,
  }: BookingCancelledEventPayload) {
    this.logger.log(
      `[BOOKING_EVENT] Handling booking cancelled - bookingId: ${booking.id}, userId: ${booking.userId}`,
    );

    const tz = booking.court.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: booking.userId,
        event: BookingEventType.CANCELLED,
      }),
      this.remindersService.removeReminders(booking.id),
      this.notifyParticipants(booking.id, NotificationType.BOOKING_CANCELLED, {
        bookingId: booking.id,
      }, [], {
        courtName: booking.court.name,
        branchName: booking.court.branch.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court.sport,
        cancelledByName: booking.user?.fullName,
        cancellationReason: booking.cancellationReason,
      }),
      this.notificationsService.notifyStaff(
        { tenantId: booking.court.branch.tenantId, branchId: booking.court.branch.id },
        {
          type: NotificationType.BOOKING_CANCELLED,
          data: {
            bookingId: booking.id,
            courtId: booking.courtId,
            court: booking.court.name,
            courtName: booking.court.name,
          },
          emailData: {
            bookingId: booking.id,
            courtName: booking.court.name,
            branchName: booking.court.branch.name,
            originalDate: startDateLocal.format('MMM DD, YYYY'),
            originalTime: `${startDateLocal.format('h:mm A')} - ${endDateLocal.format('h:mm A')}`,
            cancelledBy: booking.user?.fullName || 'Staff',
            cancellationReason: 'Cancelled by user',
            refundStatus: 'Processing',
            contactPerson: '',
            contactPhone: '',
            contactEmail: '',
          },
          resourceId: booking.id,
        },
      ),
    ]);

  }

  @OnEvent(BookingEventType.PARTICIPANT_INVITATION_ACCEPTED)
  private async handleParticipantAccepted({
    participant,
    userId,
  }: ParticipantRespondedEventPayload) {
    const { booking } = participant;
    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId,
        event: BookingEventType.PARTICIPANT_JOINED,
      }),
      this.notifyParticipants(booking.id, NotificationType.BOOKING_INVITATION_ACCEPTED, {
        userId,
        bookingId: booking.id,
        name: participant.user?.fullName || 'A player',
      }, [userId], {
        acceptedByName: participant.user?.fullName || 'A player',
        courtName: booking.court?.name,
        branchName: booking.court?.branch?.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court?.sport,
        bookingId: booking.id,
        currentParticipants: booking.participants?.filter(p => p.status === ParticipantStatus.READY || p.status === ParticipantStatus.ENTERED).length || 1,
        maxParticipants: 10,
      })
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_INVITATION_REJECTED)
  private async handleParticipantRejected({
    participant,
    userId,
    rejectionReason,
  }: ParticipantRespondedEventPayload) {
    const { booking } = participant;
    const tz = booking.court?.schedule?.timeZone || 'UTC';
    const startDateLocal = dayjs(booking.startDate).tz(tz);
    const endDateLocal = dayjs(booking.endDate).tz(tz);

    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId,
        event: BookingEventType.PARTICIPANT_INVITATION_REJECTED,
        data: {
          reason: rejectionReason
        }
      }),
      this.eventsService.deleteParticipantEvents(booking.id, userId),
      this.notificationsService.sendNotification([booking.userId], {
        type: NotificationType.BOOKING_INVITATION_REJECTED,
        data: {
          userId: userId,
          bookingId: booking.id,
          name: participant.user?.fullName || 'A player',
        },
        resourceId: booking.id,
        emailData: {
          rejectedByName: participant.user?.fullName || 'A player',
          courtName: booking.court?.name,
          branchName: booking.court?.branch?.name,
          date: startDateLocal.format('MMM DD, YYYY'),
          startTime: startDateLocal.format('h:mm A'),
          endTime: endDateLocal.format('h:mm A'),
          sportType: booking.court?.sport,
          bookingId: booking.id,
        },
      })
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_JOINED)
  private async handleParticipantJoined({
    participant,
  }: ParticipantJoinedEventPayload) {
    const { booking } = participant;
    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: participant.userId,
        event: BookingEventType.PARTICIPANT_JOINED,
      }),

      this.notifyParticipants(
        booking.id,
        NotificationType.BOOKING_JOINED,
        {
          participantId: participant.id,
          userId: participant.userId,
          bookingId: booking.id,
          name: participant.user?.fullName || 'A player',
        },
        [participant.userId],
      ),
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_ENTERED)
  private async handleParticipantEntered({

    participant,
  }: ParticipantEnteredEventPayload) {
    const { booking } = participant;
    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: participant.userId,
        event: BookingEventType.PARTICIPANT_ENTERED,
      }),
      this.notifyParticipants(
        booking.id,
        NotificationType.BOOKING_ENTERED,
        {
          participantId: participant.id,
          userId: participant.userId,
          bookingId: booking.id,
          name: participant.user?.fullName || 'A player',
        },
        [participant.userId],
      ),
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_PAYMENT_COMPLETED)
  @Transactional()
  private async handlePaymentCompleted({
    booking,
    userId,
  }: BookingPaymentCompletedEventPayload) {
    await this.eventsService.create({
      bookingId: booking.id,
      userId,
      event: BookingEventType.PARTICIPANT_JOINED,
    })

    const payer = await this.usersService.getById(userId);
    await this.notifyParticipants(booking.id, NotificationType.BOOKING_JOINED, {
      bookingId: booking.id,
      userId,
      name: payer?.fullName || 'A player',
    }, [userId])
  }

  @OnEvent(BookingEventType.PARTICIPANT_REMOVED)
  private async handleParticipantRemoved({
    participant,
    removedBy,
  }: { participant: Participant; removedBy: string }) {
    const booking = participant.booking;
    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: removedBy,
        event: BookingEventType.PARTICIPANT_REMOVED,
        data: {
          removedUserId: participant.userId,
          removedByUserId: removedBy
        }
      }),
      this.eventsService.deleteParticipantEvents(booking.id, participant.userId),
      this.notificationsService.sendNotification(participant.userId, {
        type: NotificationType.BOOKING_PARTICIPANT_REMOVED,
        data: {
          bookingId: booking.id,
          message: 'You have been removed from the booking'
        },
      }),
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_CANCELLED)
  private async handleParticipantLeft({
    participant,
  }: { participant: Participant }) {
    const booking = participant.booking;
    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: participant.userId,
        event: BookingEventType.PARTICIPANT_CANCELLED,
        data: {
          cancellationReason: participant.cancellationReason
        }
      }),
      this.eventsService.deleteParticipantEvents(booking.id, participant.userId),
      this.notifyParticipants(booking.id, NotificationType.BOOKING_PARTICIPANT_CANCELLED, {
        leftUserId: participant.userId,
        bookingId: booking.id,
        name: participant.user?.fullName || 'A player',
      }, [participant.userId])
    ]);
  }

  @OnEvent(BookingEventType.PARTICIPANT_ADDED)
  private async handleParticipantAdded({
    participant,
    addedBy,
  }: { participant: Participant; addedBy: string }) {
    const booking = participant.booking;
    await Promise.allSettled([
      this.eventsService.create({
        bookingId: booking.id,
        userId: addedBy,
        event: BookingEventType.PARTICIPANT_ADDED,
        data: {
          addedUserId: participant.userId,
          addedByUserId: addedBy
        }
      }),
      this.notifyParticipants(booking.id, NotificationType.BOOKING_JOINED, {
        newUserId: participant.userId,
        userId: participant.userId,
        bookingId: booking.id,
        name: participant.user?.fullName || 'A player',
      }, [participant.userId, addedBy]),
      this.notificationsService.sendNotification(participant.userId, {
        type: NotificationType.BOOKING_PARTICIPANT_ADDED,
        data: {
          bookingId: booking.id,
        },
        resourceId: booking.id,
      }),
    ]);
  }
}
