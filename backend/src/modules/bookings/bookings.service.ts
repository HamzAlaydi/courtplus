import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
  ConflictException,
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
  BookingPaymentCapturedEventPayload,
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
import { dayjs, parseBookingDateTime } from '../shared/dayjs';
import {
  BOOKING_NOT_FOUND,
  ONLY_CREATOR_CAN_CANCEL,
  PARTICIPANT_NOT_FOUND,
  ALREADY_RESPONDED,
  SLOT_ALREADY_RESERVED,
  SLOT_OVERLAPS_WITH_BOOKING,
  COURT_NOT_FOUND,
  BLOCKED_BY_VENUE,
  PARTICIPANT_ALREADY_PAID,
  BOOKING_NOT_JOINABLE,
  BOOKING_JOIN_APPROVAL_NOT_REQUIRED,
  ONLY_CREATOR_CAN_MANAGE,
  BOOKING_MAX_PARTICIPANTS_REACHED,
  BOOKING_GENDER_RESTRICTION,
  USER_ALREADY_HAS_BOOKING_DURING_TIME,
  BOOKING_NOT_OPEN,
  BOOKING_NOT_ACTIVE,
  BOOKING_CANCELLATION_WINDOW_CLOSED,
  ONLY_CREATOR_CAN_REMOVE_PARTICIPANTS,
  CANNOT_REMOVE_BOOKING_CREATOR,
  ONLY_CREATOR_CAN_ADD_PARTICIPANTS,
  SCHEDULE_NOT_FOUND,
  NOT_ALLOWED,
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
import { BOOKING, roundMoney, splitSeatCount, splitShares} from './booking.constants';
import { PayoutConstants } from 'src/modules/payouts/constants/payout.constants';
import type { BookingConfirmedEmailProps } from 'src/emails/booking-confirmed';

/**
 * A Google Maps link for the confirmation email's "Get Directions" button.
 *
 * The API stores position as GeoJSON, so `coordinates` is [longitude,
 * latitude] and NOT [lat, lng] - swapping them drops the pin in the wrong
 * hemisphere. Returns undefined when the venue has no pin and no address, and
 * the template then omits the button entirely.
 */
const buildMapsUrl = (location?: {
  address?: string;
  coordinates?: { coordinates?: number[] } | null;
}): string | undefined => {
  const [lng, lat] = location?.coordinates?.coordinates ?? [];
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (location?.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }
  return undefined;
};
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
    const { courtId, paymentType, participants = [], startAt, duration } = input;
    this.logger.log(
      `[BOOKING_FLOW] Initiating booking - userId: ${sessionUser.id}, courtId: ${courtId}, startAt: ${startAt}, duration: ${duration}min, paymentType: ${paymentType}`,
    );

    // `sessionUser` MUST be passed. CourtsService.findOne only applies the
    // customer visibility filters — court.status = AVAILABLE,
    // branch.suspendedAt IS NULL, tenant.blockedAt IS NULL — when a user is
    // supplied. Omitting it made every one of those filters dead code, so a
    // customer holding a court UUID from an earlier listing could book and pay
    // for a court ops had suspended, a court under a suspended branch, a court
    // of a blocked tenant, or one still awaiting approval. GET /courts/:id
    // already 404s for exactly those cases; only the booking path leaked.
    const court = await this.courtsService.findOne(
      courtId,
      {
        schedule: true,
        branch: true,
      },
      sessionUser,
    );

    // findOne returns null for an unknown or non-visible court; dereferencing
    // it produced a 500 instead of a 404.
    if (!court) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - court not found or not bookable: ${courtId}`,
      );
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    if (!court.schedule) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking failed - schedule not found for courtId: ${courtId}`,
      );
      throw new BadRequestException(SCHEDULE_NOT_FOUND);
    }

    // A venue can bar a customer from ITS courts only. This replaces the old
    // platform-wide block that vendor staff could apply to anyone.
    const venueTenantId = court.branch?.tenantId;
    if (
      venueTenantId &&
      (await this.usersService.isBlockedForTenant(venueTenantId, sessionUser.id))
    ) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking refused - customer blocked by venue - tenantId: ${venueTenantId}, userId: ${sessionUser.id}`,
      );
      throw new ForbiddenException(BLOCKED_BY_VENUE);
    }

    const startDate = parseBookingDateTime(startAt, court.schedule.timeZone);
    const endDate = dayjs(startDate).add(duration, 'minutes').toDate();

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
      if (reason === SLOT_OVERLAPS_WITH_BOOKING) {
        throw new ConflictException(reason);
      }
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

    // Sanitise the invitee list BEFORE any money is computed or charged.
    // The organiser is added as a participant by create(), so listing
    // themself (or the same friend twice) later violated the unique
    // (bookingId, userId) index — after the card had been charged. The
    // booking was never created, nothing refunded it, and Stripe retried the
    // webhook for three days. It also skewed the per-seat share.
    const inviteeIds = Array.from(
      new Set((participants ?? []).filter((id) => id && id !== sessionUser.id)),
    );
    if (inviteeIds.length !== (participants ?? []).length) {
      this.logger.warn(
        `[BOOKING_FLOW] Invitee list cleaned - userId: ${sessionUser.id}, submitted: ${(participants ?? []).length}, kept: ${inviteeIds.length}`,
      );
    }
    input = { ...input, participants: inviteeIds };

    const bookingAmount = roundMoney(
      court.hourlyRate * (duration / BOOKING.MINUTES_PER_HOUR),
    );

    // A split with nobody to split with is a whole booking. Left as SPLIT it
    // produced holdAmount 0, which makes Stripe capture automatically while
    // every later path still treats the payment as an uncaptured hold —
    // the booking could then never settle, cancel or refund.
    const seats = splitSeatCount(input);
    const effectivePaymentType =
      paymentType === PaymentType.SPLIT && seats <= 1
        ? PaymentType.WHOLE
        : paymentType;

    const paymentInfo: Partial<Payment> = {
      amount: bookingAmount,
      currency: court.currency,
      // Downstream (create(), processParticipantPayment) reads the payment
      // type back off this snapshot, so it has to carry the effective one.
      data: { ...input, paymentType: effectivePaymentType },
    };
    if (effectivePaymentType === PaymentType.SPLIT) {
      const { share, organiserShare } = splitShares(bookingAmount, seats);
      paymentInfo.amount = organiserShare;
      paymentInfo.holdAmount = roundMoney(bookingAmount - organiserShare);
      this.logger.debug(
        `[BOOKING_FLOW] Split payment calculated - totalAmount: ${bookingAmount}, seats: ${seats}, organiserShare: ${organiserShare}, perSeatShare: ${share}, holdAmount: ${paymentInfo.holdAmount}`,
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
      participants: userIds = [],
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

    // book() already sanitises the customer path, but create() is also the
    // staff entry point and is re-entered from the payment webhook with the
    // list stored on the payment. A repeated id violates the unique
    // (bookingId, userId) index AFTER the card has been charged, and it also
    // inflates the seat count the split divides by.
    const submittedUserIds = userIds;
    userIds = Array.from(
      new Set(submittedUserIds.filter((id) => id && id !== user.id)),
    );
    if (userIds.length !== submittedUserIds.length) {
      this.logger.warn(
        `[BOOKING_FLOW] Participant list normalised - submitted: ${submittedUserIds.length}, kept: ${userIds.length}`,
      );
    }

    // This runs again at payment-capture time (processParticipantPayment ->
    // create), so the court's state is re-checked rather than trusted from
    // when the payment intent was created — a court suspended in between must
    // not still produce a confirmed booking.
    //
    // Only a Customer is passed through to findOne. For Staff the existing
    // explicit tenant check below is kept instead: `user` here is a
    // Partial<SessionUser>, and letting findOne apply
    // `branch.tenantId = :tenantId` with a possibly-undefined tenantId would
    // silently turn valid staff bookings into 404s.
    const court = await this.courtsService.findOne(
      courtId,
      {
        schedule: true,
        branch: true,
      },
      user.type === UserType.Customer ? (user as SessionUser) : undefined,
    );

    if (!court) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking creation failed - court not found or not bookable: ${courtId}`,
      );
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    // Staff may only create bookings on courts owned by their own tenant.
    // Return 404 (not 403) to avoid leaking the existence of other
    // tenants' courts.
    if (
      user.type === UserType.Staff &&
      court.branch?.tenantId !== user.tenantId
    ) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking creation failed - cross-tenant court access: courtId=${courtId}, staffId=${user.id}`,
      );
      throw new NotFoundException(COURT_NOT_FOUND);
    }

    if (!court.schedule) {
      this.logger.warn(
        `[BOOKING_FLOW] Booking creation failed - schedule not found for courtId: ${courtId}`,
      );
      throw new BadRequestException(SCHEDULE_NOT_FOUND);
    }

    const startDate = parseBookingDateTime(startAt, court.schedule.timeZone);
    const endDate = dayjs(startDate).add(duration, 'minutes').toDate();

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
      if (reason === SLOT_OVERLAPS_WITH_BOOKING) {
        throw new ConflictException(reason);
      }
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
    // Freeze the denominator now. Recomputing it later from whoever happened
    // to be attached made the organiser share, the joiner shares and the
    // settlement all divide by different numbers.
    if (paymentType === PaymentType.SPLIT) {
      booking.splitSeats = splitSeatCount({
        open,
        playersASide,
        participants: userIds,
      });
    }
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

    // Whole-payment and staff-created bookings are already paid at creation,
    // so emit PAYMENT_COMPLETED here to count their revenue exactly once.
    // Split bookings stay PENDING and emit only when the last participant pays.
    if (booking.paymentStatus === PaymentStatus.COMPLETED) {
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PAYMENT_COMPLETED, {
          booking,
          userId: user.id,
        } satisfies BookingPaymentCompletedEventPayload);
      });
    }

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

      // Whole-payment bookings capture money here (split creator payments are
      // only a HOLD - no money captured, so no event for them).
      if (payment.status === PaymentStatus.COMPLETED) {
        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PAYMENT_CAPTURED, {
            booking,
            userId: payment.userId,
            paymentId: payment.id,
            amount: Number(payment.amount),
            currency: payment.currency,
          } satisfies BookingPaymentCapturedEventPayload);
        });
      }
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
      // Persist the payment itself. The participant -> payment relation has
      // no cascade, so saving the participant below left the payment row at
      // PENDING: every later "all participants paid" check read PENDING from
      // the DB, the creator's hold was never released, the booking never
      // reached COMPLETED, and at settlement the participant's share was
      // charged AGAIN to the creator (processPendingPayments treats a PENDING
      // payment as unpaid) — the same seat paid twice.
      await this.paymentsService.save(payment);
      this.participantsService.transitionParticipantStatus(participant, ParticipantStatus.READY);
      participant.payment = payment;
      await this.participantsService.save(participant);

      this.logger.log(
        `[BOOKING_FLOW] Participant payment completed - bookingId: ${bookingId}, userId: ${userId}, participantStatus: ${participant.status}`,
      );

      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.PAYMENT_CAPTURED, {
          booking,
          userId,
          paymentId: payment.id,
          amount: Number(payment.amount),
          currency: payment.currency,
        } satisfies BookingPaymentCapturedEventPayload);
      });

      const freshParticipants = await this.participantsService.getParticipants(bookingId);
      const creator = freshParticipants.find((p) => p.isCreator);
      // A participant who left (and was refunded) must not hold settlement
      // hostage: their row stays on the booking as CANCELLED, so the "everyone
      // has paid" test could never pass again and the organiser's hold was
      // never captured — the venue was paid nothing for the whole booking.
      const activeParticipants = freshParticipants.filter(
        (p) => p.status !== ParticipantStatus.CANCELLED,
      );
      const nonCreatorParticipants = activeParticipants.filter(
        (p) => !p.isCreator,
      );

      // An open match has seats with no participant row at all. Judging "has
      // everyone paid?" on attached rows alone meant the FIRST joiner of a
      // 4-seat match satisfied it: the organiser's share was captured and
      // Stripe released the rest of the hold, so the empty seats could never
      // be charged at settlement and the venue collected half the court.
      const seatCount =
        booking.splitSeats ??
        splitSeatCount({
          open: booking.open,
          playersASide: booking.playersASide,
          participants: nonCreatorParticipants,
        });
      const paidNonCreatorCount = nonCreatorParticipants.filter(
        (p) =>
          p.status === ParticipantStatus.READY &&
          p.payment?.status === PaymentStatus.COMPLETED,
      ).length;
      const everySeatPaid = paidNonCreatorCount >= seatCount - 1;

      const allNonCreatorsPaid =
        everySeatPaid &&
        nonCreatorParticipants.every(
          (p) => p.status === ParticipantStatus.READY && p.payment?.status === PaymentStatus.COMPLETED,
        );

      if (allNonCreatorsPaid && creator?.payment?.status === PaymentStatus.HOLD) {
        // Everyone else has paid: collect the ORGANISER'S OWN share from the
        // authorisation and let Stripe release the remainder. This used to
        // cancel the whole hold, so the organiser of a split booking never
        // paid for their seat — the court was paid for by everyone but them.
        const creatorShare = Number(creator.payment.amount);
        this.logger.log(
          `[BOOKING_FLOW] All participants paid - capturing creator share ${creatorShare} - bookingId: ${bookingId}, creatorPaymentId: ${creator.payment.id}`,
        );
        await this.paymentsService.completePayment(creator.payment.id, creatorShare);
        creator.payment.status = PaymentStatus.COMPLETED;

        const creatorPaymentId = creator.payment.id;
        const creatorUserId = creator.userId;
        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PAYMENT_CAPTURED, {
            booking,
            userId: creatorUserId,
            paymentId: creatorPaymentId,
            amount: creatorShare,
            currency: booking.currency,
          } satisfies BookingPaymentCapturedEventPayload);
        });
      }

      // Same seat rule: a match with unsold seats is not fully paid yet, so
      // it must not be marked COMPLETED (which would also credit the vendor
      // for money that has not been collected).
      const isAllParticipantsPaid =
        everySeatPaid &&
        activeParticipants.every(
          (p) =>
            p.status === ParticipantStatus.READY &&
            (p.payment?.status === PaymentStatus.COMPLETED || p.payment?.status === PaymentStatus.RELEASED),
        );

      if (isAllParticipantsPaid && booking.paymentStatus !== PaymentStatus.COMPLETED) {
        booking.paymentStatus = PaymentStatus.COMPLETED;
        await this.bookingsRepository.save(booking);

        this.logger.log(
          `[BOOKING_FLOW] Booking payment completed - bookingId: ${bookingId}, activeParticipants: ${activeParticipants.length}`,
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
      .leftJoinAndSelect('court.schedule', 'schedule')
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
        'schedule.timeZone',
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
      // A venue whose subscription lapsed stops appearing and stops taking
      // NEW bookings; what customers already paid for is untouched.
      qb.andWhere('tenant."subscriptionLapsedAt" IS NULL');
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

    // A customer browsing open matches wants matches they can still join.
    // Without these defaults the screen listed finished games from months ago
    // with a "Book now" button, because the only filter was `open = true`.
    // GET /bookings/open is match DISCOVERY: it may only ever return matches a
    // customer can still join. The single filter used to be `open = true`, so
    // the screen listed games that finished months earlier, each with a
    // "Book now" button. ListOpenBookingsDto has no `status` field (the param
    // is stripped by the whitelist), so these bounds cannot be overridden.
    if (isLookingForOpenBookings && user.type === UserType.Customer) {
      qb.andWhere('booking.endDate > :nowForOpen', { nowForOpen: new Date() })
        .andWhere('booking.status = :joinableStatus', {
          joinableStatus: BookingStatus.PENDING,
        })
        // Soonest first: a joinable match is only useful before it starts.
        .orderBy('booking.startDate', 'ASC');
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
      // Booking datetimes are stored as UTC; the court's schedule timezone is
      // the authoritative zone for rendering them as local wall times.
      timeZone: booking.court?.schedule?.timeZone ?? null,
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

  async getOne(id: string, user: SessionUser): Promise<Booking> {
    const booking = await this.find({ id }, user);
    if (booking.items.length === 0) {
      // The booking either does not exist or is not visible to this
      // user/tenant — 404 in both cases to avoid leaking existence.
      throw new NotFoundException(BOOKING_NOT_FOUND);
    }
    return booking.items[0];
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

    // Staff may only cancel bookings that belong to their own tenant.
    if (isStaff && booking.court?.branch?.tenantId !== user.tenantId) {
      this.logger.warn(
        `[BOOKING_FLOW] Cancellation denied - cross-tenant attempt: bookingId: ${id}, userId: ${user.id}`,
      );
      throw new ForbiddenException(NOT_ALLOWED);
    }

    this.logger.debug(
      `[BOOKING_FLOW] Cancellation context - bookingId: ${id}, isCreator: ${isCreator}, isStaff: ${isStaff}, currentStatus: ${booking.status}`,
    );

    if (isCreator || isStaff) {
      // The status flips to IN_PROGRESS by a queued job at start time; if
      // that job is late (or the queue is down) the status alone would still
      // allow a full refund for a match that is already being played.
      const started = booking.startDate && new Date(booking.startDate) <= new Date();
      if (
        booking.status === BookingStatus.IN_PROGRESS ||
        booking.status === BookingStatus.COMPLETED ||
        started
      ) {
        this.logger.warn(
          `[BOOKING_FLOW] Cancellation failed - booking already started - bookingId: ${id}, status: ${booking.status}`,
        );
        throw new BadRequestException(BOOKING_NOT_ACTIVE);
      }

      // Policy: customers cancel free of charge only up to
      // CANCELLATION_CUTOFF_HOURS before the start. The venue itself may
      // cancel at any time (the customer is refunded).
      if (!isStaff) {
        this.assertCancellationWindowOpen(booking);
      }

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

      // Money went back (refund) or was never taken (hold released): say so
      // on the booking, and keep the reason — both were dropped before, so a
      // cancelled booking still read "paid" in the app and the vendor never
      // saw why it was cancelled.
      const moneyReturned = booking.participants.some(
        (p) =>
          p.payment &&
          [PaymentStatus.COMPLETED, PaymentStatus.HOLD].includes(p.payment.status),
      );
      await this.bookingsRepository.update(id, {
        status: BookingStatus.CANCELLED,
        cancellationReason: cancellationReason?.trim() || null,
        ...(moneyReturned ? { paymentStatus: PaymentStatus.REFUNDED } : {}),
      });

      this.logger.log(
        `[BOOKING_FLOW] Booking cancelled - bookingId: ${id}, cancelledBy: ${user.id}`,
      );

      const cancelledBy = {
        id: user.id,
        type: user.type,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
      };
      const reason = cancellationReason?.trim() || null;
      runOnTransactionCommit(() => {
        this.eventEmitter.emit(BookingEventType.CANCELLED, {
          booking,
          cancelledBy,
          reason,
        } satisfies BookingCancelledEventPayload);
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
      // Same cut-off for a participant leaving as for the organiser.
      this.assertCancellationWindowOpen(booking);

      // Leaving is always allowed before the match starts, but the share is
      // only refunded while the booking is still being paid for. Once every
      // seat is paid the organiser's share has been captured and their hold
      // released, so a refund here would leave the court short with nobody
      // left to charge — that money came out of the vendor's revenue.
      const settled = booking.paymentStatus === PaymentStatus.COMPLETED;
      if (participant.payment) {
        if (participant.payment.status === PaymentStatus.COMPLETED && settled) {
          this.logger.log(
            `[BOOKING_FLOW] Participant leaves a settled booking - no refund - bookingId: ${id}, userId: ${user.id}, paymentId: ${participant.payment.id}`,
          );
        } else if (participant.payment.status === PaymentStatus.COMPLETED) {
          this.logger.log(
            `[BOOKING_FLOW] Refunding leaving participant - bookingId: ${id}, userId: ${user.id}, paymentId: ${participant.payment.id}`,
          );
          await this.paymentsService.refund(participant.payment.id);
          // The seat is open again.
          await this.bookingsRepository.update(id, {
            paymentStatus: PaymentStatus.PARTIALLY_PAID,
          });
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

  /** Customers may cancel/leave only until CANCELLATION_CUTOFF_HOURS before start. */
  private assertCancellationWindowOpen(booking: Booking): void {
    const cutoff =
      new Date(booking.startDate).getTime() -
      BOOKING.CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
    if (Date.now() >= cutoff) {
      this.logger.warn(
        `[BOOKING_FLOW] Cancellation refused - inside the ${BOOKING.CANCELLATION_CUTOFF_HOURS}h window - bookingId: ${booking.id}`,
      );
      throw new BadRequestException(BOOKING_CANCELLATION_WINDOW_CLOSED);
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

    // Guard against a second charge. The mobile Booking Details screen renders
    // from a snapshot and keeps showing "Pay your part" after a successful
    // payment; tapping it again used to mint another PaymentIntent, charge the
    // card, and then fail in the webhook on a READY -> READY transition, so the
    // money was neither recorded nor refunded.
    if (participant.status !== ParticipantStatus.PENDING_PAYMENT) {
      this.logger.warn(
        `[BOOKING_FLOW] Payment refused - participant not awaiting payment - bookingId: ${booking.id}, userId: ${user?.id}, status: ${participant.status}`,
      );
      throw new BadRequestException(PARTICIPANT_ALREADY_PAID);
    }

    if (
      participant.payment &&
      [PaymentStatus.COMPLETED, PaymentStatus.HOLD].includes(
        participant.payment.status,
      )
    ) {
      this.logger.warn(
        `[BOOKING_FLOW] Payment refused - participant already has a settled payment - bookingId: ${booking.id}, paymentId: ${participant.payment.id}`,
      );
      throw new BadRequestException(PARTICIPANT_ALREADY_PAID);
    }

    // Every seat pays the same share of the court. This used to divide by the
    // number of participants attached RIGHT NOW, so each joiner paid a
    // different amount (100%, then 50%, then 33%...) and the venue collected
    // far more than the court price.
    const total = roundMoney(
      booking.hourlyRate * (booking.duration / BOOKING.MINUTES_PER_HOUR),
    );
    // Prefer the denominator frozen at creation; fall back for rows created
    // before splitSeats existed.
    const seats =
      booking.splitSeats ??
      splitSeatCount({
        open: booking.open,
        playersASide: booking.playersASide,
        participants: booking.participants?.filter((p) => !p.isCreator) ?? [],
      });
    const { share } = splitShares(total, seats);

    const response = await this.paymentsService.createPaymentIntentDetails(
      { amount: share, bookingId: booking.id, currency: booking.currency },
      user,
    );

    // Expire the participant's intent like book() does for the organiser.
    // Without this, an abandoned "pay your part" sheet left a live intent for
    // ever: confirming it days later charged a seat that had since been
    // covered by the organiser's hold, or paid for a cancelled booking.
    await this.paymentsService.schedulePaymentCancellation(response.paymentId);

    return response;
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

    // Only someone who was actually invited may respond. Rejecting just READY
    // let a PENDING_APPROVAL join-requester approve themselves onto the match
    // without the organiser, and let a CANCELLED participant who had already
    // left (and been refunded) walk back in.
    if (participant.status !== ParticipantStatus.PENDING_RESPONSE) {
      this.logger.warn(
        `[BOOKING_FLOW] Invitation response failed - not awaiting a response - bookingId: ${bookingId}, userId: ${user.id}, currentStatus: ${participant.status}`,
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

      // Only the DB row was updated; the in-memory copy still held the old
      // status. pay() below rejects a participant who is not PENDING_PAYMENT,
      // so accepting a split invitation would have been refused outright.
      participant.status = newStatus;

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

  /**
   * Sent when a booking completes. Owner/organizer only (booking.userId) —
   * pinging every participant on top of BOOKING_ENDED would be noisy, and the
   * organizer is the one who set up the game. Staff-created bookings (no
   * customer owner) are skipped.
   */
  @OnEvent(BookingEventType.ENDED_SWEEP)
  private async handleEndedSweepEvent({ booking }: { booking: Booking }) {
    await this.notifyRateReminder(booking);
  }

  async notifyRateReminder(booking: Booking): Promise<void> {
    if (!booking.userId) {
      return;
    }
    let courtName = booking.court?.name;
    if (courtName === undefined) {
      const court = await this.courtsService.findOne(booking.courtId, {});
      courtName = court?.name ?? '';
    }
    await this.notificationsService.sendNotification(booking.userId, {
      type: NotificationType.RATE_REMINDER,
      data: {
        kind: NotificationType.RATE_REMINDER,
        bookingId: booking.id,
        courtId: booking.courtId,
        courtName,
      },
      resourceId: booking.id,
      sendEmail: false,
    });
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
        // The capacity check below reads each participant's payment status to
        // keep a paid-but-departed seat off the market; without this relation
        // it would silently see undefined and resell the seat.
        .leftJoinAndSelect('participants.payment', 'participantPayment')
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

      // `open` alone said nothing about whether the match is still joinable:
      // a cancelled or long-finished booking kept the flag, so a customer
      // holding its id could join and be charged for a game that will never
      // be played. The listing now hides these; this closes the direct call.
      if (booking.status !== BookingStatus.PENDING) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - booking not joinable - bookingId: ${bookingId}, status: ${booking.status}`,
        );
        throw new BadRequestException(BOOKING_NOT_JOINABLE);
      }

      if (booking.endDate <= new Date()) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - booking already finished - bookingId: ${bookingId}, endDate: ${booking.endDate.toISOString()}`,
        );
        throw new BadRequestException(BOOKING_NOT_JOINABLE);
      }

      // The venue's block applies to joining an open match too. It was
      // enforced only in book(), so a blocked customer could still walk in
      // through someone else's match at the same venue.
      const joinTenantId = booking.court?.branch?.tenantId;
      if (
        joinTenantId &&
        (await this.usersService.isBlockedForTenant(
          joinTenantId,
          sessionUser.id,
        ))
      ) {
        this.logger.warn(
          `[BOOKING_FLOW] Join refused - customer blocked by venue - tenantId: ${joinTenantId}, userId: ${sessionUser.id}`,
        );
        throw new ForbiddenException(BLOCKED_BY_VENUE);
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

      // Gender is only a gate when the organiser actually restricted the
      // match. The old condition led with `!user.gender`, so anybody who had
      // never filled that field in was refused even by a match open to
      // everyone — and the error told them it was a "gender restriction" on a
      // match that had none.
      const isGenderRestricted =
        booking.gender === Gender.MALE || booking.gender === Gender.FEMALE;
      if (isGenderRestricted && user.gender !== booking.gender) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - gender restriction - bookingId: ${bookingId}, userId: ${sessionUser.id}, userGender: ${user.gender}, bookingGender: ${booking.gender}`,
        );
        throw new ForbiddenException(BOOKING_GENDER_RESTRICTION);
      }

      // Level is ADVISORY, never a gate (product decision, 2026-09-26).
      //
      // It used to require an EXACT match on the player's saved level for
      // that sport, so an advanced player was refused from an intermediate
      // match, and anyone who had never recorded a level for that sport —
      // which is almost everyone, since nothing in the signup flow asks —
      // could not join any levelled match at all. Open matches exist to find
      // players; the organiser still sees each level on the join request and
      // can decline. The requirement is shown on the match card so it reads
      // as the preference it is.

      // A seat that was PAID FOR is taken, even if its player later left: a
      // participant who leaves a settled booking keeps no refund, so putting
      // their seat back on sale collected the same seat's price twice.
      const participantCount = booking.participants.filter(
        (p) =>
          p.status === ParticipantStatus.READY ||
          p.status === ParticipantStatus.ENTERED ||
          p.status === ParticipantStatus.PENDING_APPROVAL ||
          p.status === ParticipantStatus.PENDING_PAYMENT ||
          (p.status === ParticipantStatus.CANCELLED &&
            p.payment?.status === PaymentStatus.COMPLETED),
      ).length;

      // Cap by the seats this match actually has, not just the global maximum:
      // a 1-a-side open match has two seats, so the old check let four people
      // in and collected far more than the court price.
      const matchSeats = Math.min(
        BOOKING.MAX_PARTICIPANTS_PER_BOOKING,
        booking.splitSeats ??
          splitSeatCount({
            open: booking.open,
            playersASide: booking.playersASide,
            participants: booking.participants?.filter((p) => !p.isCreator) ?? [],
          }),
      );

      if (participantCount >= matchSeats) {
        this.logger.warn(
          `[BOOKING_FLOW] Join booking failed - match is full - bookingId: ${bookingId}, currentCount: ${participantCount}, seats: ${matchSeats}`,
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

        // Only split bookings charge the joiner; on whole bookings the
        // creator already paid the full amount, so no payment intent.
        if (booking.paymentType === PaymentType.SPLIT) {
          return this.pay(participant);
        }
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


  /**
   * Settle a split booking's hold on request from the expiry sweep.
   *
   * SlotsService cannot call BookingsService directly (BookingsService already
   * depends on it), so the sweep emits this and awaits it via emitAsync.
   */
  @OnEvent(BookingEventType.SETTLE_PENDING)
  async handleSettlePending({ booking }: { booking: Booking }): Promise<void> {
    if (!booking?.id || booking.paymentType !== PaymentType.SPLIT) {
      return;
    }
    try {
      await this.processPendingPayments(booking.id);
    } catch (error) {
      this.logger.error(
        `Failed to settle pending payments for booking ${booking.id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
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

      // Seats nobody paid for. A FAILED payment is an unpaid seat too; the
      // organiser (HOLD) is never in this list.
      const participantsWithPendingPayments = participants.filter(
        (p) =>
          !p.isCreator &&
          (!p.payment ||
            [PaymentStatus.PENDING, PaymentStatus.FAILED].includes(
              p.payment.status,
            )),
      );

      // How many seats the court is divided into, frozen at creation.
      const seats =
        booking.splitSeats ??
        splitSeatCount({
          open: booking.open,
          playersASide: booking.playersASide,
          participants: participants.filter((p) => !p.isCreator),
        });

      // Seats that were never taken count as unpaid too. An open match that
      // nobody joined has NO non-creator participant rows at all, so the old
      // check returned here and captured nothing: the organiser's
      // authorisation simply expired at Stripe and the venue was paid nothing
      // for a court that had been blocked all evening.
      const paidNonCreators = participants.filter(
        (p) =>
          !p.isCreator &&
          p.payment &&
          [PaymentStatus.COMPLETED, PaymentStatus.RELEASED].includes(
            p.payment.status,
          ),
      ).length;
      const unpaidSeats = Math.max(0, seats - 1 - paidNonCreators);

      if (unpaidSeats === 0 && participantsWithPendingPayments.length === 0) {
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

      // Same denominator as creation and /pay. Using `participants.length`
      // here meant the per-seat amount changed whenever somebody joined or
      // left, so the organiser was charged a different share than the one the
      // joiners had been quoted.
      const { share: amountPerParticipant } = splitShares(
        Number(booking.totalAmount),
        seats,
      );
      const totalToDeduct = roundMoney(amountPerParticipant * unpaidSeats);

      if (creatorPayment.holdAmount < totalToDeduct) {
        this.logger.warn(
          `Insufficient held amount. Required: ${totalToDeduct}, Available: ${creatorPayment.holdAmount}`,
        );
      }

      const actualDeduction = Math.min(
        totalToDeduct,
        creatorPayment.holdAmount,
      );

      // The organiser pays their own seat PLUS every seat nobody paid for.
      // Capturing only the deduction left the organiser's own share
      // uncollected on every split booking that reached settlement.
      const creatorShare = Number(creatorPayment.amount);
      const captureTotal = creatorShare + actualDeduction;
      await this.paymentsService.completePayment(creatorPayment.id, captureTotal);

      if (booking.userId && captureTotal > 0) {
        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PAYMENT_CAPTURED, {
            booking,
            userId: booking.userId as string,
            paymentId: creatorPayment.id,
            amount: captureTotal,
            currency: booking.currency,
          } satisfies BookingPaymentCapturedEventPayload);
        });
      }

      // Those seats are now covered by the organiser. Their own
      // PaymentIntents were never confirmed, so they cannot be captured —
      // the old loop tried, threw on the first one, and rolled the whole
      // settlement back AFTER the organiser's capture had already happened
      // at Stripe. Cancel them so a late payment cannot charge a seat twice.
      for (const participant of participantsWithPendingPayments) {
        if (participant.paymentId) {
          await this.paymentsService.cancelPayment(participant.paymentId);
        }
      }

      this.logger.log(`Deducted ${actualDeduction} from creator's held amount`);

      // The court is now fully paid for: the organiser covered their own seat
      // and every unpaid one. Without this the booking stayed PARTIALLY_PAID,
      // PAYMENT_COMPLETED was never emitted, and BalanceService — which holds
      // vendor revenue on that event and whose reconciler only looks at
      // COMPLETED bookings — never credited the venue a single riyal for any
      // split booking settled this way.
      if (booking.paymentStatus !== PaymentStatus.COMPLETED) {
        booking.paymentStatus = PaymentStatus.COMPLETED;
        await this.bookingsRepository.save(booking);

        this.logger.log(
          `[BOOKING_FLOW] Booking payment completed via hold settlement - bookingId: ${bookingId}, captured: ${captureTotal}`,
        );

        runOnTransactionCommit(() => {
          this.eventEmitter.emit(BookingEventType.PAYMENT_COMPLETED, {
            booking,
          });
        });
      }

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
      // What this customer is actually on the hook for right now. On a whole
      // booking that is the court total; on a split it is only the
      // organiser's seat, and `roundMoney` matches what book() charged - the
      // raw total is an unrounded float that disagreed with the card.
      const isSplit =
        booking.paymentType === PaymentType.SPLIT &&
        booking.paymentStatus !== PaymentStatus.COMPLETED;
      const seats = booking.splitSeats ?? 1;
      const bookingTotal = Number(booking.totalAmount);
      const organiserAmount = isSplit
        ? splitShares(bookingTotal, seats).organiserShare
        : roundMoney(bookingTotal);

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
        // The venue was emailed about this booking from the very first
        // release; the person who paid for it was not. They had an in-app
        // row and nothing in their inbox to show at the gate.
        sendEmail: true,
        emailData: {
          customerName: booking.user.fullName,
          courtName: booking.court.name,
          branchName: booking.court.branch.name,
          branchAddress: booking.court.branch.location?.address,
          date: startDateLocal.format('MMM DD, YYYY'),
          startTime: startDateLocal.format('h:mm A'),
          endTime: endDateLocal.format('h:mm A'),
          sportType: booking.court.sport,
          paymentAmount: organiserAmount.toFixed(2),
          currency: booking.currency || PayoutConstants.DEFAULT_CURRENCY,
          // A split booking is NOT paid at this point: the organiser's card
          // carries an uncaptured hold for the whole court and they will be
          // charged only their own seat. Saying "booked and paid" with the
          // court total was a receipt for up to 4x what they owe, for a
          // session that is not secured until every seat is paid.
          isSplit,
          seats,
          bookingId: booking.id,
          mapsUrl: buildMapsUrl(booking.court.branch?.location),
        } satisfies BookingConfirmedEmailProps,
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
    cancelledBy,
    reason,
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
      // The in-app/push text used to be a bare "Your booking has been
      // cancelled" with only a bookingId — no court, no time, no reason.
      this.notifyParticipants(booking.id, NotificationType.BOOKING_CANCELLED, {
        bookingId: booking.id,
        courtId: booking.courtId,
        courtName: booking.court.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        byVenue: cancelledBy?.type === UserType.Staff,
        reason: reason || undefined,
        reasonSuffix: reason ? `: ${reason}` : '',
      }, [], {
        courtName: booking.court.name,
        branchName: booking.court.branch.name,
        date: startDateLocal.format('MMM DD, YYYY'),
        startTime: startDateLocal.format('h:mm A'),
        endTime: endDateLocal.format('h:mm A'),
        sportType: booking.court.sport,
        cancelledByName:
          cancelledBy?.type === UserType.Staff
            ? booking.court.branch.name
            : cancelledBy?.name || booking.user?.fullName,
        cancellationReason: reason || booking.cancellationReason,
      }),
      this.notificationsService.notifyStaff(
        { tenantId: booking.court.branch.tenantId, branchId: booking.court.branch.id },
        {
          type: NotificationType.BOOKING_CANCELLED,
          data: {
            kind: NotificationType.BOOKING_CANCELLED,
            bookingId: booking.id,
            courtId: booking.courtId,
            court: booking.court.name,
            courtName: booking.court.name,
            date: startDateLocal.format('MMM DD, YYYY'),
            startTime: startDateLocal.format('h:mm A'),
            reasonSuffix: reason ? `: ${reason}` : '',
          },
          emailData: {
            bookingId: booking.id,
            courtName: booking.court.name,
            branchName: booking.court.branch.name,
            originalDate: startDateLocal.format('MMM DD, YYYY'),
            originalTime: `${startDateLocal.format('h:mm A')} - ${endDateLocal.format('h:mm A')}`,
            // Was hard-coded to the customer's name and "Cancelled by user"
            // even when the venue's own staff cancelled.
            cancelledBy:
              cancelledBy?.type === UserType.Staff
                ? `${booking.court.branch.name} (staff)`
                : cancelledBy?.name || booking.user?.fullName || 'Customer',
            cancellationReason: reason || 'No reason given',
            refundStatus: 'Refunded to the original payment method',
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
