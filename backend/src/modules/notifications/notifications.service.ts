import {
  Injectable,
  Inject,
  forwardRef,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { FirebaseService, FIREBASE_INVALID_TOKENS_EVENT } from 'src/modules/shared/services/firebase.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Session } from '../auth/entities/session.entity';
import { Notification, NotificationType } from './entities/notification.entity';
import { UsersService } from 'src/modules/users/users.service';
import { EmailService, EmailTemplate } from '../shared/services/email.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';
import { SessionUser } from '../auth/@types/session';
import { ListNotificationsResponseDto } from './dto/list-notifications-response.dto';
import { StaffService } from '../staff/staff.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import _ from 'lodash';
import { i18next } from './content/i18n';
import { BookingsService } from '../bookings/bookings.service';
import { PostsService } from '../posts/posts.service';
import { ReviewsService } from '../reviews/reviews.service';
import { BranchesService } from '../branches/branches.service';
import { CourtsService } from '../courts/courts.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { IsNull, MoreThan } from 'typeorm';
import { Language } from '../users/entities/enums';
import { UserType } from '../auth/@types/user.type';
type UserToken = {
  token: string;
  language: Language;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly notificationTypeToEmailTemplate: Partial<Record<NotificationType, EmailTemplate>> = {
    [NotificationType.BOOKING_CREATED]: EmailTemplate.STAFF_BOOKING_CREATED,
    [NotificationType.BOOKING_CANCELLED]: EmailTemplate.STAFF_BOOKING_CANCELLED,
    [NotificationType.BOOKING_REMINDER]: EmailTemplate.STAFF_BOOKING_REMINDER,
  };

  private readonly participantEmailTemplates: Partial<Record<NotificationType, EmailTemplate>> = {
    [NotificationType.BOOKING_INVITATION]: EmailTemplate.BOOKING_INVITATION,
    [NotificationType.BOOKING_REMINDER]: EmailTemplate.BOOKING_REMINDER_PARTICIPANT,
    [NotificationType.BOOKING_CANCELLED]: EmailTemplate.BOOKING_CANCELLED_PARTICIPANT,
    [NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED]: EmailTemplate.BOOKING_JOIN_REQUEST_SUBMITTED,
    [NotificationType.BOOKING_JOIN_REQUEST_APPROVED]: EmailTemplate.BOOKING_JOIN_REQUEST_APPROVED,
    [NotificationType.BOOKING_JOIN_REQUEST_REJECTED]: EmailTemplate.BOOKING_JOIN_REQUEST_REJECTED,
    [NotificationType.BOOKING_INVITATION_ACCEPTED]: EmailTemplate.BOOKING_INVITATION_ACCEPTED,
    [NotificationType.BOOKING_INVITATION_REJECTED]: EmailTemplate.BOOKING_INVITATION_REJECTED,
  };

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => BranchesService))
    private readonly branchesService: BranchesService,
    @Inject(forwardRef(() => CourtsService))
    private readonly courtsService: CourtsService,
    @Inject(forwardRef(() => StaffService))
    private readonly staffService: StaffService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
    @Inject(forwardRef(() => PostsService))
    private readonly postsService: PostsService,
    @Inject(forwardRef(() => ReviewsService))
    private readonly reviewsService: ReviewsService,
    private readonly firebaseService: FirebaseService,
    private readonly emailService: EmailService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRedis() private readonly redis: Redis,
  ) { }

  async list(
    query: ListNotificationsDto,
    user: SessionUser,
  ): Promise<ListNotificationsResponseDto> {
    const { page, pageSize, type } = query;
    const { id: userId, deviceId } = user;

    const where: FindOptionsWhere<Notification> = { userId };
    if (type) {
      where.type = type;
    }

    const [notifications, total, preferences] = await Promise.all([
      this.notificationRepository.find({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.notificationRepository.count({ where }),
      this.usersService.getPreferences(userId, deviceId),
    ]);

    return {
      items: await this.populateNotifications(notifications, preferences?.language),
      pagination: {
        totalCount: total,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    };
  }

  async populateNotifications(
    notifications: Notification[],
    language: Language = Language.EN,
  ) {
    const usersToGet = new Set<string>();
    const bookingsToGet = new Set<string>();
    const postsToGet = new Set<string>();
    const reviewsToGet = new Set<string>();
    const branchesToGet = new Set<string>();
    const courtsToGet = new Set<string>();

    for (const notification of notifications) {
      const { userId, bookingId, postId, reviewId, branchId, courtId } =
        notification.data ?? {};

      if (userId) usersToGet.add(userId);
      if (bookingId) bookingsToGet.add(bookingId);
      if (postId) postsToGet.add(postId);
      if (reviewId) reviewsToGet.add(reviewId);
      if (branchId) branchesToGet.add(branchId);
      if (courtId) courtsToGet.add(courtId);
    }

    const [users, bookings, posts, reviews, branches, courts] =
      await Promise.all([
        this.usersService.findByIds(Array.from(usersToGet), {
          firstName: true,
          lastName: true,
          id: true,
          avatarUrl: true,
        }),
        this.bookingsService.findByIds(Array.from(bookingsToGet)),
        this.postsService.findByIds(Array.from(postsToGet)),
        this.reviewsService.findByIds(Array.from(reviewsToGet), {
          id: true,
          rating: true,
        }),
        this.branchesService.findByIds(Array.from(branchesToGet), {
          id: true,
          name: true,
        }),
        this.courtsService.findByIds(Array.from(courtsToGet), {
          id: true,
          name: true,
        }),
      ]);

    for (const notification of notifications) {
      const { bookingId, branchId, courtId, postId, reviewId, userId } =
        notification.data ?? {};
      notification.relations = {};
      if (userId) {
        const user = users.find((u) => u.id === userId);
        notification.relations.user = user;
      }
      if (bookingId) {
        const booking = bookings.find((b) => b.id === bookingId);
        notification.relations.booking = booking;
      }
      if (branchId) {
        const branch = branches.find((b) => b.id === branchId);
        notification.relations.branch = branch;
      }
      if (courtId) {
        const court = courts.find((c) => c.id === courtId);
        notification.relations.court = court;
      }
      if (postId) {
        const post = posts.find((p) => p.id === postId);
        notification.relations.post = post;
      }
      if (reviewId) {
        const review = reviews.find((r) => r.id === reviewId);
        notification.relations.review = review;
      }

      const { title, body, image } = this.generateNotificationContent(
        notification.type,
        { ...notification.data, ...notification.relations },
        language,
      );
      notification.content = body;
      notification.title = title;
      notification.image = image;
    }
    return notifications;
  }

  async saveToken(user: SessionUser, token: string) {
    await Promise.all([
      this.sessionRepository.update(user.sid, { fcmToken: token }),
      this.invalidateUserTokens(user.id),
    ]);
  }

  private async getTokens(
    userIdOrIds: string | string[],
  ): Promise<UserToken[]> {
    const userIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
    const tokens: UserToken[] = [];
    const notCachedUserIds: string[] = [];

    for (const userId of userIds) {
      const cachedTokens = await this.cacheManager.get<UserToken[]>(
        `tokens#${userId}`,
      );

      if (cachedTokens) {
        tokens.push(...cachedTokens);
      } else {
        notCachedUserIds.push(userId);
      }
    }

    if (notCachedUserIds.length > 0) {
      const sessionsWithPreferences = await this.usersService.getActiveSessionsWithPreferences(notCachedUserIds);

      const usersTokens = _.groupBy(sessionsWithPreferences, 'userId');



      for (const userId in usersTokens) {
        const userTokens = usersTokens[userId].map((session) => {
          return { token: session.fcmToken, language: session.language };
        });
        this.cacheManager.set(`tokens#${userId}`, userTokens);
        tokens.push(...userTokens);
      }
    }

    return tokens;
  }


  private generateNotificationContent(
    type: NotificationType,
    data: Record<string, any>,
    language: string,
  ): { title: string; body: string; image: string | null } {
    const notificationKey = `notifications.${type}`;

    const title = i18next.t(`${notificationKey}.title`, {
      ...data,
      lng: language,
    });
    const content = i18next.t(`${notificationKey}.content`, {
      ...data,
      lng: language,
    });

    let image = null;
    switch (type) {
      case NotificationType.POST_LIKE:
      case NotificationType.FOLLOW:
        image = data.user?.avatarUrl;
        break;
    }
    return { title: title, body: content, image };
  }

  async markAsRead(notificationId: string, userId: string) {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { readAt: new Date() },
    );

    if (result.affected === 0) {
      throw new ForbiddenException();
    }
  }

  async markAllAsSeen(user: SessionUser) {
    switch (user.type) {
      case UserType.Staff:
        await this.staffService.resetNotificationsCount(user.id);
        break;
      case UserType.Customer:
        await this.usersService.resetNotificationsCount(user.id);
        break;
    }
    await this.redis.set(`notifications:seen:${user.id}`, new Date().toISOString());
  }

  async sendEmail(
    emails: string[],
    { data, type }: Pick<Notification, 'data' | 'type'>,
  ) {
    const template = this.notificationTypeToEmailTemplate[type];
    if (!template) {
      return;
    }
    return this.emailService.sendEmail({
      to: emails,
      template,
      data,
    });
  }

  async sendNotification(
    userIdOrIds: string | string[],
    {
      data,
      type,
      resourceId,
      emailData,
      sendEmail = true,
    }: Pick<Notification, 'data' | 'type' | 'resourceId'> & {
      emailData?: Record<string, any>;
      sendEmail?: boolean;
    },
  ) {
    const userIds = [...new Set(Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds])];
    const notifications = userIds.map((userId) => ({
      userId,
      data,
      type,
      resourceId,
    }))

    await this.notificationRepository.insert(notifications);
    await this.usersService.incrementNotificationsCount(userIds);

    const tokens = await this.getTokens(userIds);

    const pushPromise = tokens.length > 0
      ? Promise.allSettled(
        tokens.map(({ token, language = Language.EN }) => {
          const { body, title } = this.generateNotificationContent(
            type,
            data,
            language,
          );
          return this.firebaseService.sendNotification(token, {
            data,
            type,
            content: body,
            title: title,
          });
        }),
      ).then((results) => {
        const failures = results.filter(
          (result): result is PromiseRejectedResult => result.status === 'rejected',
        );
        if (failures.length > 0) {
          this.logger.warn(
            `Failed to send ${failures.length}/${results.length} push notifications for type ${type}`,
            failures.map((f) => f.reason),
          );
        }
      })
      : Promise.resolve();

    const emailPromise = sendEmail
      ? this.sendParticipantEmails(userIds, type, emailData)
      : Promise.resolve();

    await Promise.all([pushPromise, emailPromise]);
  }

  private async sendParticipantEmails(
    userIds: string[],
    type: NotificationType,
    emailData?: Record<string, any>,
  ) {
    const template = this.participantEmailTemplates[type];
    if (!template || !emailData) {
      return;
    }

    const userEmails = await this.usersService.getUserEmailsWithLanguage(userIds);

    const emailsByLanguage = userEmails.reduce(
      (acc, { email, language }) => {
        const lang = language || Language.EN;
        if (!acc[lang]) acc[lang] = [];
        acc[lang].push(email);
        return acc;
      },
      {} as Record<Language, string[]>,
    );

    const emailPromises = Object.entries(emailsByLanguage).map(
      ([language, emails]) =>
        this.emailService.sendEmail({
          to: emails,
          template,
          data: emailData,
          language,
        }),
    );

    try {
      await Promise.all(emailPromises);
    } catch (error) {
      this.logger.warn(
        `Failed to send participant emails for type ${type}`,
        error,
      );
    }
  }

  async notifyStaff(
    {
      tenantId,
      branchId,
    }: { tenantId?: string; branchId?: string; },
    {
      email = true,
      emailData,
      data,
      type,
      resourceId,
    }: {
      email?: boolean;
      emailData?: any;
      data?: any;
      type: NotificationType;
      resourceId?: string;
    },
  ) {
    const staff = await this.staffService.getStaff({ tenantId, branchId });
    await this.notifyStaffMembers(staff, { email, emailData, data, type, resourceId });
  }

  async notifyOps({
    email = false,
    emailData,
    data,
    type,
    resourceId,
  }: {
    email?: boolean;
    emailData?: any;
    data?: any;
    type: NotificationType;
    resourceId?: string;
  }) {
    const superAdmins = await this.staffService.getSuperAdmins();
    await this.notifyStaffMembers(superAdmins, { email, emailData, data, type, resourceId });
  }

  private async notifyStaffMembers(
    staff: { id: string; email?: string }[],
    {
      email = true,
      emailData,
      data,
      type,
      resourceId,
    }: {
      email?: boolean;
      emailData?: any;
      data?: any;
      type: NotificationType;
      resourceId?: string;
    },
  ) {
    const staffIds = staff.map((staffer) => staffer.id);
    const notifications: DeepPartial<Notification>[] = staff.map(
      (staffer) => ({
        userId: staffer.id,
        data,
        type,
        resourceId,
      }),
    );

    if (notifications.length === 0) {
      return;
    }

    await this.notificationRepository.insert(notifications);
    await this.staffService.incrementNotificationsCount(staffIds);
    await this.sendPushNotifications(staffIds, { data, type });

    if (email) {
      const emails = staff
        .map((staffer) => staffer.email)
        .filter((email): email is string => !!email);
      await this.sendEmail(emails, { data: emailData, type });
    }
  }

  private async sendPushNotifications(
    userIds: string[],
    { data, type }: Pick<Notification, 'data' | 'type'>,
  ) {
    const tokens = await this.getTokens(userIds);

    if (tokens.length === 0) return;

    const results = await Promise.allSettled(
      tokens.map(({ token, language = Language.EN }) => {
        const { body, title } = this.generateNotificationContent(type, data, language);
        return this.firebaseService.sendNotification(token, {
          data,
          type,
          content: body,
          title: title,
        });
      }),
    );

    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );
    if (failures.length > 0) {
      this.logger.warn(
        `Failed to send ${failures.length}/${results.length} push notifications for type ${type}`,
        failures.map((f) => f.reason),
      );
    }
  }

  async invalidateUserTokens(userId: string) {
    await this.cacheManager.del(`tokens#${userId}`);
  }

  async getUnseenCount(userId: string, type: UserType) {
    switch (type) {
      case UserType.Staff:
        return await this.staffService.getUnseenNotificationsCount(userId);
      case UserType.Customer:
        return await this.usersService.getUnseenNotificationsCount(userId);
    }
  }

  @OnEvent(FIREBASE_INVALID_TOKENS_EVENT)
  async handleInvalidFcmTokens({ tokens }: { tokens: string[] }) {
    if (!tokens?.length) return;

    try {
      const result = await this.sessionRepository.update(
        { fcmToken: In(tokens) },
        { fcmToken: null },
      );
      this.logger.log(`Cleared ${result.affected} invalid FCM tokens from sessions`);
    } catch (error) {
      this.logger.error('Failed to clear invalid FCM tokens', error);
    }
  }
}
