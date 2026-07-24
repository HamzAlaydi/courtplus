import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Review } from './entities/review.entity';
import { FindOptionsSelect, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ListReviewsDto } from './dto/list-reviews.dto';
import { BookingsService } from 'src/modules/bookings/bookings.service';
import { ReviewEvent, type ReviewEventPayload } from './reviews.events';
import { ListReviewsResponseDto } from './dto/list-reviews-response.dto';
import { CourtsService } from '../courts/courts.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import {
  REVIEW_ALREADY_EXISTS,
  PARTICIPANT_NOT_FOUND,
  BOOKING_NOT_FOUND,
  BOOKING_NOT_COMPLETED,
} from 'src/modules/shared/error-codes';
import { BookingStatus } from '../bookings/entities/booking.entity';
import { BranchesService } from '../branches/branches.service';
import type { SessionUser } from '../auth/@types/session';
import { UsersService } from '../users/users.service';
import { Transactional, runOnTransactionCommit } from 'typeorm-transactional';
import { ParticipantsService } from '../bookings/participants.service';
@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => ParticipantsService))
    private readonly participantsService: ParticipantsService,
  ) { }

  async findByIds(
    ids: string[],
    select?: FindOptionsSelect<Review>,
  ): Promise<Review[]> {
    return this.reviewRepository.find({
      where: {
        id: In(ids),
      },
      select,
    });
  }

  @Transactional()
  async add(
    { rating, comment, bookingId }: CreateReviewDto,
    user: SessionUser,
  ) {
    const { id: userId } = user;
    const existingReview = await this.reviewRepository.findOne({
      where: { userId, bookingId },
    })
    if (existingReview) {
      throw new BadRequestException(REVIEW_ALREADY_EXISTS);
    }
    const booking = await this.bookingsService.findOne(
      { id: bookingId },
      {
        court: {
          branch: true,
        },
      },
    )
    if (!booking) {
      throw new BadRequestException(BOOKING_NOT_FOUND);
    }
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException(BOOKING_NOT_COMPLETED);
    }
    const participant = await this.participantsService.getParticipant(bookingId, userId)
    if (!participant) {
      throw new BadRequestException(PARTICIPANT_NOT_FOUND);
    }

    const review = await this.reviewRepository.save({
      rating,
      comment,
      userId,
      bookingId,
    });

    runOnTransactionCommit(() => {
      this.eventEmitter.emit(ReviewEvent.REVIEW_CREATED, {
        review,
        booking,
      } satisfies ReviewEventPayload);
    });
    return review;
  }

  async getReviews(
    query: ListReviewsDto,
    user: SessionUser,
  ): Promise<ListReviewsResponseDto> {
    const {
      userId,
      courtId,
      endDate,
      page,
      pageSize,
      rating,
      startDate,
      bookingId,
      branchId,
    } = query;

    // Build the base query with consistent joins
    const qb = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user');

    const needsBookingJoin = bookingId || courtId || branchId;
    if (needsBookingJoin) {
      qb.leftJoin('review.booking', 'booking');

      if (courtId || branchId) {
        qb.leftJoin('booking.court', 'court');

        if (branchId) {
          qb.leftJoin('court.branch', 'branch');
        }
      }
    }

    if (userId) {
      qb.andWhere('review.userId = :userId', { userId });
    }

    if (bookingId) {
      qb.andWhere('review.bookingId = :bookingId', { bookingId });
    }

    if (courtId) {
      qb.andWhere('booking.courtId = :courtId', { courtId });
    }

    if (branchId) {
      qb.andWhere('court.branchId = :branchId', { branchId });
    }

    if (rating) {
      qb.andWhere('review.rating = :rating', { rating });
    }

    if (startDate) {
      qb.andWhere('review.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('review.createdAt <= :endDate', { endDate });
    }

    // Add ordering for consistent results
    qb.orderBy('review.createdAt', 'DESC');

    // Apply pagination
    const skip = (page - 1) * pageSize;
    qb.skip(skip).take(pageSize);

    const [reviews, total] = await qb.getManyAndCount();

    return {
      items: reviews,
      pagination: {
        currentPage: page,
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async delete(id: string, user: SessionUser) {
    const review = await this.reviewRepository.findOne({
      where: { id, userId: user.id },
      relations: ['booking'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const result = await this.reviewRepository.softDelete({ id, userId: user.id });
    this.eventEmitter.emit(ReviewEvent.REVIEW_DELETED, {
      review,
      booking: review.booking,
    });
    return !!result.affected;
  }

  @OnEvent(ReviewEvent.REVIEW_CREATED)
  @Transactional()
  private async handleReviewCreatedEvent({
    review,
    booking,
  }: ReviewEventPayload) {
    await this.courtsService.updateRating(booking.courtId, review.rating, true);
    await this.branchesService.updateRating(booking.court.branch.id, review.rating, true);
    await this.usersService.incrementCount(review.userId, 1, 'reviewsCount');

    const court = await this.courtsService.findOne(booking.courtId, {
      branch: true,
    });

    await this.notificationsService.notifyStaff(
      {
        tenantId: court.branch.tenantId,
      },
      {
        email: true,
        type: NotificationType.REVIEW_ADDED,
        data: {
          reviewId: review.id,
        },
        resourceId: review.id,
      },
    );
  }

  @OnEvent(ReviewEvent.REVIEW_DELETED)
  @Transactional()
  private async handleReviewDeletedEvent({
    review,
    booking,
  }: ReviewEventPayload) {
    await this.courtsService.updateRating(
      booking.courtId,
      review.rating,
      false,
    );
    await this.branchesService.updateRating(booking.id, review.rating, false);
    await this.usersService.incrementCount(review.userId, -1, 'reviewsCount');
  }
}
