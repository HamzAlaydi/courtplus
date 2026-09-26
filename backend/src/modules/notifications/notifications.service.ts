import {
  Injectable,
  Inject,
  forwardRef,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import type { PayoutFailedEmailProps } from 'src/emails/payout-failed';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, FindOptionsWhere, In, Repository } from 'typeorm';
import { FirebaseService, FIREBASE_INVALID_TOKENS_EVENT } from 'src/modules/shared/services/firebase.service';
import { NotificationsRealtimeService } from './notifications-realtime.service';
import type { MessageEvent } from '@nestjs/common';
import {
  Observable,
  from,
  fromEvent,
  interval,
  map,
  merge,
  takeUntil,
  timer,
} from 'rxjs';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthEvent } from '../auth/auth.events';
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
  notifications?: Partial<Record<string, boolean>>;
};

/**
 * Which Settings > Notifications toggle governs a type. Types not listed
 * (payments, refunds, cancellations, reminders) are always delivered.
 */
const PREFERENCE_BY_TYPE: Partial<Record<NotificationType, string>> = {
  [NotificationType.FOLLOW]: 'followers',
  [NotificationType.POST_LIKE]: 'likes',
  [NotificationType.MOMENT_POSTED]: 'updates',
  [NotificationType.BOOKING_JOIN_REQUEST_SUBMITTED]: 'openBookings',
  [NotificationType.BOOKING_JOIN_REQUEST_APPROVED]: 'openBookings',
  [NotificationType.BOOKING_JOIN_REQUEST_REJECTED]: 'openBookings',
  [NotificationType.BOOKING_INVITATION]: 'bookingActivity',
  [NotificationType.BOOKING_INVITATION_ACCEPTED]: 'bookingActivity',
  [NotificationType.BOOKING_INVITATION_REJECTED]: 'bookingActivity',
  [NotificationType.BOOKING_JOINED]: 'bookingActivity',
  [NotificationType.BOOKING_ENTERED]: 'bookingActivity',
  [NotificationType.BOOKING_PARTICIPANT_ADDED]: 'bookingActivity',
  [NotificationType.BOOKING_PARTICIPANT_REMOVED]: 'bookingActivity',
  [NotificationType.BOOKING_PARTICIPANT_CANCELLED]: 'bookingActivity',
  [NotificationType.BOOKING_STARTED]: 'bookingActivity',
  [NotificationType.BOOKING_ENDED]: 'bookingActivity',
  [NotificationType.RATE_REMINDER]: 'updates',
};

const allowedByPreference = (token: UserToken, type: NotificationType): boolean => {
  const key = PREFERENCE_BY_TYPE[type];
  if (!key || !token.notifications) return true;
  return token.notifications[key] !== false;
};

/** Push-token cache lifetime; short so a stale device stops receiving. */
const PUSH_TOKEN_CACHE_TTL_MS = 60_000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly notificationTypeToEmailTemplate: Partial<Record<NotificationType, EmailTemplate>> = {
    [NotificationType.BOOKING_CREATED]: EmailTemplate.STAFF_BOOKING_CREATED,
    [NotificationType.BOOKING_CANCELLED]: EmailTemplate.STAFF_BOOKING_CANCELLED,
    [NotificationType.BOOKING_REMINDER]: EmailTemplate.STAFF_BOOKING_REMINDER,
    [NotificationType.REVIEW_ADDED]: EmailTemplate.REVIEW_ADDED,
    [NotificationType.COURT_APPROVED]: EmailTemplate.COURT_APPROVED,
    [NotificationType.COURT_CHANGES_REQUESTED]: EmailTemplate.COURT_CHANGES_REQUESTED,
    [NotificationType.COURT_SUSPENDED]: EmailTemplate.RESOURCE_SUSPENDED,
    [NotificationType.BRANCH_SUSPENDED]: EmailTemplate.RESOURCE_SUSPENDED,
    [NotificationType.TENANT_SUSPENDED]: EmailTemplate.RESOURCE_SUSPENDED,
    [NotificationType.COURT_PENDING_PAYMENT]: EmailTemplate.COURT_PENDING_PAYMENT,
    // Billing and payouts reach the vendor by email now. Without an entry
    // here `sendEmail` returned early and the `email: true` flag at the call
    // site was a no-op that read like the mail was going out.
    [NotificationType.SUBSCRIPTION_PAYMENT_FAILED]:
      EmailTemplate.SUBSCRIPTION_PAYMENT_FAILED,
    [NotificationType.PAYOUT_FAILED]: EmailTemplate.PAYOUT_FAILED,
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
    // The customer's own receipt. BOOKING_CREATED also appears in the staff
    // map above, pointing at STAFF_BOOKING_CREATED - the two audiences get
    // deliberately different emails for the same event.
    [NotificationType.BOOKING_CREATED]: EmailTemplate.BOOKING_CONFIRMED,
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
    private readonly realtime: NotificationsRealtimeService,
  ) { }

  /** Keeps proxies and browsers from timing out an otherwise silent stream. */
  private static readonly STREAM_HEARTBEAT_MS = 25_000;
  /**
   * Streams are re-established by the client. Bounding their lifetime keeps
   * a stream from outliving the access token it was opened with by more
   * than this, and lets load balancers drain instances.
   */
  private static readonly STREAM_MAX_LIFETIME_MS = 15 * 60 * 1000;

  /**
   * Server-Sent Events for one signed-in user: the current unseen count on
   * connect, then every change (new notification, mark-seen elsewhere) the
   * moment it happens, plus a heartbeat. Before this the bells polled every
   * 30 seconds, so "realtime" meant up to half a minute late.
   */
  stream(
    user: SessionUser,
    req: { on: (event: 'close', listener: () => void) => unknown },
  ): Observable<MessageEvent> {
    const snapshot$ = from(this.getUnseenCount(user.id, user.type)).pipe(
      map(
        (count): MessageEvent => ({
          type: 'count',
          data: {
            kind: 'count',
            recipientType: user.type,
            recipientId: user.id,
            unseenCount: count ?? 0,
          },
        }),
      ),
    );
    const events$ = this.realtime
      .subscribe({ id: user.id, type: user.type })
      .pipe(map((event): MessageEvent => ({ type: event.kind, data: event })));
    const heartbeat$ = interval(NotificationsService.STREAM_HEARTBEAT_MS).pipe(
      map((): MessageEvent => ({ type: 'ping', data: { at: Date.now() } })),
    );
    const closed$ = fromEvent(req as any, 'close');
    const expired$ = timer(NotificationsService.STREAM_MAX_LIFETIME_MS);

    // Ends on client close, on the lifetime cap, and on instance shutdown —
    // the last one is what lets the HTTP server actually close.
    return merge(snapshot$, events$, heartbeat$).pipe(
      takeUntil(merge(closed$, expired$, this.realtime.shutdown$)),
    );
  }

  /**
   * Push the new unseen count (and the item) to any open stream of these
   * recipients. Best-effort, and only after the rows exist so a client that
   * refetches on receipt sees them.
   */
  private async publishRealtime(
    userIds: string[],
    recipientType: UserType,
    notification: {
      type: NotificationType;
      data?: Record<string, any>;
      ids?: Array<{ id?: string }>;
    },
  ): Promise<void> {
    await Promise.all(
      userIds.map(async (userId, index) => {
        try {
          const unseenCount =
            (await this.getUnseenCount(userId, recipientType)) ?? 0;
          await this.realtime.publish({
            kind: 'notification',
            recipientType,
            recipientId: userId,
            unseenCount,
            notification: {
              id: notification.ids?.[index]?.id,
              type: notification.type,
              data: notification.data,
              createdAt: new Date().toISOString(),
            },
          });
        } catch (error) {
          this.logger.warn(
            `Realtime publish failed for ${recipientType} ${userId}: ${(error as Error).message}`,
          );
        }
      }),
    );
  }

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

  @OnEvent(AuthEvent.SESSIONS_REVOKED)
  private async handleSessionsRevoked({ userId }: { userId: string }) {
    await this.invalidateTokens(userId);
  }

  /** Drop a user's cached push tokens (logout, session revoke, token reset). */
  async invalidateTokens(userIdOrIds: string | string[]): Promise<void> {
    const userIds = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
    await Promise.all(
      userIds.map((userId) => this.cacheManager.del(`tokens#${userId}`)),
    );
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
          const prefs = (session as any).preferences;
          return {
            token: session.fcmToken,
            // The language lives on the mapped preferences row; reading
            // session.language sent every push in English.
            language: prefs?.language ?? session.language,
            notifications: prefs?.notifications,
          };
        });
        // Short TTL. This cache had none, so a logged-out device kept
        // receiving another account's push notifications until the process
        // restarted. The cache is also cleared explicitly on logout.
        this.cacheManager.set(`tokens#${userId}`, userTokens, PUSH_TOKEN_CACHE_TTL_MS);
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

  /** Marks every unread notification of the user read and clears the badge. */
  async markAllAsRead(user: SessionUser): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId: user.id, readAt: IsNull() },
      { readAt: new Date() },
    );
    await this.markAllAsSeen(user);
    return { updated: result.affected ?? 0 };
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
    // Other tabs/devices of the same user drop their badge too.
    await this.realtime.publish({
      kind: 'count',
      recipientType: user.type,
      recipientId: user.id,
      unseenCount: 0,
    });
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

    const inserted = await this.notificationRepository.insert(notifications);
    await this.usersService.incrementNotificationsCount(userIds);
    await this.publishRealtime(userIds, UserType.Customer, {
      type,
      data,
      ids: inserted.identifiers,
    });

    // Customer pushes honour Settings > Notifications (the toggles were a placebo).
    const tokens = (await this.getTokens(userIds)).filter((t) =>
      allowedByPreference(t, type),
    );

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

  /**
   * Payout notifications.
   *
   * PayoutsService already emitted these events; nothing listened, so nobody
   * was ever told: ops did not learn a vendor had requested a withdrawal, and
   * the vendor heard nothing when it was approved, rejected or paid. Wired as
   * event listeners rather than a direct call because PayoutsModule does not
   * import NotificationsModule.
   */
  @OnEvent('payout.requested')
  private async handlePayoutRequested({ payout }: { payout: any }) {
    if (!payout?.tenantId) return;
    try {
      const tenantName = await this.resolveTenantName(payout.tenantId);
      await this.notifyOps({
        type: NotificationType.PAYOUT_REQUESTED,
        resourceId: payout.id,
        data: {
          payoutId: payout.id,
          tenantId: payout.tenantId,
          tenantName,
          amount: payout.amount,
          currency: payout.currency,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to notify ops of payout ${payout?.id}: ${(error as Error).message}`,
      );
    }
  }

  @OnEvent('payout.approved')
  private async handlePayoutApproved({ payout }: { payout: any }) {
    await this.notifyVendorOfPayout(payout, NotificationType.PAYOUT_APPROVED);
  }

  @OnEvent('payout.rejected')
  private async handlePayoutRejected({ payout }: { payout: any }) {
    await this.notifyVendorOfPayout(payout, NotificationType.PAYOUT_REJECTED, {
      reason: payout?.failureReason ?? '',
    });
  }

  @OnEvent('payout.completed')
  private async handlePayoutCompleted({ payout }: { payout: any }) {
    await this.notifyVendorOfPayout(payout, NotificationType.PAYOUT_COMPLETED);
  }

  /**
   * A payout the provider refuses used to be completely silent: 'payout.failed'
   * had no listener here, and there was no PAYOUT_FAILED notification type at
   * all. The money was quietly refunded to the vendor's balance with no
   * explanation, so they retried straight into the same failure.
   */
  @OnEvent('payout.failed')
  private async handlePayoutFailed({ payout }: { payout: any }) {
    const reason = payout?.failureReason ?? '';
    // Best-effort: the vendor's name is decoration, and a lookup failure must
    // not be the reason they are never told their money did not arrive.
    let tenantName = '';
    try {
      if (payout?.tenantId) {
        tenantName = await this.resolveTenantName(payout.tenantId);
      }
    } catch (error) {
      this.logger.warn(
        `Could not resolve tenant ${payout?.tenantId} for a failed payout: ${(error as Error).message}`,
      );
    }
    await this.notifyVendorOfPayout(
      payout,
      NotificationType.PAYOUT_FAILED,
      { reason },
      {
        // 'A venue' is the ops-facing placeholder resolveTenantName falls back
        // to; addressing the owner as "Hi A venue," reads like a broken mail
        // merge, so drop the name entirely when it is not a real one.
        vendorName:
          tenantName && tenantName !== 'A venue' ? tenantName : 'there',
        // numeric(14,2) comes back as a string; format it rather than
        // printing the raw column, and never render an empty amount.
        amount: Number(payout?.amount ?? 0).toFixed(2),
        currency: payout?.currency ?? '',
        reason: reason || undefined,
      } satisfies PayoutFailedEmailProps,
    );
  }

  private async notifyVendorOfPayout(
    payout: any,
    type: NotificationType,
    extra: Record<string, unknown> = {},
    emailData?: Record<string, unknown>,
  ) {
    if (!payout?.tenantId) return;
    try {
      await this.notifyStaff(
        { tenantId: payout.tenantId },
        {
          type,
          resourceId: payout.id,
          emailData,
          data: {
            payoutId: payout.id,
            amount: payout.amount,
            currency: payout.currency,
            ...extra,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify tenant ${payout?.tenantId} about payout ${payout?.id}: ${(error as Error).message}`,
      );
    }
  }

  /** Venue name for the ops-facing payout notification. */
  private async resolveTenantName(tenantId: string): Promise<string> {
    const [row]: Array<{ name: string | null }> =
      await this.notificationRepository.manager.query(
        `SELECT name FROM tenants WHERE id = $1`,
        [tenantId],
      );
    return row?.name || 'A venue';
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

    const inserted = await this.notificationRepository.insert(notifications);
    await this.staffService.incrementNotificationsCount(staffIds);
    await this.publishRealtime(staffIds, UserType.Staff, {
      type,
      data,
      ids: inserted.identifiers,
    });
    await this.sendPushNotifications(staffIds, { data, type });

    if (email) {
      const emails = staff
        .map((staffer) => staffer.email)
        .filter((email): email is string => !!email);
      try {
        await this.sendEmail(emails, { data: emailData, type });
      } catch (error) {
        // The row is written and the push/SSE went out; a mail outage (SES
        // sandbox, SMTP) used to turn an approved court into a 503 for ops.
        this.logger.warn(
          `Failed to send staff email for type ${type}: ${(error as Error).message}`,
        );
      }
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
