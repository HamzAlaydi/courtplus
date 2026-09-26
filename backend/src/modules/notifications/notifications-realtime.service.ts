import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Observable, Subject } from 'rxjs';
import { UserType } from '../auth/@types/user.type';
import { NotificationType } from './entities/notification.entity';

/**
 * What a connected client receives. `count` is sent whenever the unseen
 * counter changes (new notification, mark-seen from another tab/device);
 * `notification` additionally carries the new item so the client can toast
 * it and refresh its list.
 */
export interface RealtimeNotificationEvent {
  kind: 'count' | 'notification';
  recipientType: UserType;
  recipientId: string;
  unseenCount: number;
  notification?: {
    id?: string;
    type: NotificationType;
    data?: Record<string, any>;
    createdAt: string;
  };
}

/**
 * Fan-out of notification events to connected browsers.
 *
 * The dashboard and ops bells polled every 30 seconds, so a new notification
 * took up to half a minute to show up — and every open tab hit the API twice
 * a minute forever. This service pushes instead: NotificationsService calls
 * `publish` right after it writes the rows, every API instance receives it
 * over a Redis channel, and each instance forwards it to the SSE streams it
 * holds for that recipient.
 *
 * Redis pub/sub (not an in-process emitter) is what makes this correct with
 * more than one API replica: the request that created the notification and
 * the long-lived stream for the recipient are usually on different
 * instances. If Redis is unreachable the event is still delivered to
 * streams on the local instance, and the clients' slow poll remains as the
 * fallback — realtime degrades, it never loses a notification (the row is
 * already in Postgres).
 */
@Injectable()
export class NotificationsRealtimeService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationsRealtimeService.name);
  static readonly CHANNEL = 'notifications:realtime';

  private subscriber: Redis | null = null;
  private readonly streams = new Map<string, Set<Subject<RealtimeNotificationEvent>>>();

  /**
   * Emits once when the instance is shutting down. Every SSE response is
   * bound to it (see NotificationsService.stream), because Node's
   * `server.close()` waits for active connections and a heartbeating stream
   * is never idle — without this a restart or deploy hung with the port
   * closed and the old process still alive. Clients reconnect on their own.
   */
  private readonly shuttingDown = new Subject<void>();
  readonly shutdown$: Observable<void> = this.shuttingDown.asObservable();

  constructor(@InjectRedis() private readonly redis: Redis) {}

  onModuleInit(): void {
    // A client in subscriber mode cannot run other commands, so the shared
    // connection is duplicated rather than reused.
    try {
      this.subscriber = this.redis.duplicate();
    } catch (error) {
      this.logger.error(
        'Could not open a Redis subscriber; realtime notifications are local to this instance.',
        error as Error,
      );
      return;
    }
    this.subscriber.on('error', (error) =>
      this.logger.error('Realtime subscriber error', error),
    );
    this.subscriber.on('message', (_channel, raw) => this.dispatch(raw));
    this.subscriber
      .subscribe(NotificationsRealtimeService.CHANNEL)
      .catch((error) =>
        this.logger.error(
          'Could not subscribe to the realtime channel; realtime notifications are local to this instance.',
          error as Error,
        ),
      );
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown.next();
    this.shuttingDown.complete();
    for (const subjects of this.streams.values()) {
      for (const subject of subjects) subject.complete();
    }
    this.streams.clear();
    try {
      await this.subscriber?.quit();
    } catch {
      this.subscriber?.disconnect();
    }
  }

  /** Number of open streams on this instance (for logs and tests). */
  get connectedStreams(): number {
    let n = 0;
    for (const subjects of this.streams.values()) n += subjects.size;
    return n;
  }

  /**
   * Events for one recipient. Completes nothing on its own — the caller
   * bounds it (request close, max lifetime); unsubscribing deregisters.
   */
  subscribe(recipient: {
    id: string;
    type: UserType;
  }): Observable<RealtimeNotificationEvent> {
    const key = this.key(recipient.type, recipient.id);
    return new Observable<RealtimeNotificationEvent>((observer) => {
      const subject = new Subject<RealtimeNotificationEvent>();
      const subscription = subject.subscribe(observer);
      let set = this.streams.get(key);
      if (!set) {
        set = new Set();
        this.streams.set(key, set);
      }
      set.add(subject);
      return () => {
        subscription.unsubscribe();
        set.delete(subject);
        if (set.size === 0) this.streams.delete(key);
      };
    });
  }

  /**
   * Publish to every instance. Never throws: a broken Redis must not fail
   * the business operation that produced the notification.
   */
  async publish(event: RealtimeNotificationEvent): Promise<void> {
    const raw = JSON.stringify(event);
    try {
      await this.redis.publish(NotificationsRealtimeService.CHANNEL, raw);
    } catch (error) {
      this.logger.warn(
        `Redis publish failed; delivering realtime event locally only (${error instanceof Error ? error.message : error})`,
      );
      this.dispatch(raw);
    }
  }

  private dispatch(raw: string): void {
    let event: RealtimeNotificationEvent;
    try {
      event = JSON.parse(raw);
    } catch {
      this.logger.warn('Ignoring malformed realtime event');
      return;
    }
    if (!event?.recipientId || !event?.recipientType) return;
    const subjects = this.streams.get(this.key(event.recipientType, event.recipientId));
    if (!subjects) return;
    for (const subject of subjects) subject.next(event);
  }

  private key(type: UserType, id: string): string {
    return `${type}:${id}`;
  }
}
