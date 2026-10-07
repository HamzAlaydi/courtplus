import { EventEmitter } from 'events';
import {
  NotificationsRealtimeService,
  RealtimeNotificationEvent,
} from './notifications-realtime.service';
import { UserType } from '../auth/@types/user.type';
import { NotificationType } from './entities/notification.entity';

/**
 * Minimal ioredis stand-in: `publish` loops the message back through the
 * subscriber the way Redis would, so the fan-out is tested end to end
 * without a server. `failPublish` simulates an unreachable Redis.
 */
class FakeRedis extends EventEmitter {
  failPublish = false;
  subscriber?: FakeRedis;
  subscribed: string[] = [];
  quitCalled = false;

  duplicate(): FakeRedis {
    this.subscriber = new FakeRedis();
    return this.subscriber;
  }
  async subscribe(channel: string): Promise<number> {
    this.subscribed.push(channel);
    return 1;
  }
  async publish(channel: string, message: string): Promise<number> {
    if (this.failPublish) throw new Error('ECONNREFUSED');
    this.subscriber?.emit('message', channel, message);
    return 1;
  }
  async quit(): Promise<'OK'> {
    this.quitCalled = true;
    return 'OK';
  }
  disconnect(): void {}
}

const event = (
  overrides: Partial<RealtimeNotificationEvent> = {},
): RealtimeNotificationEvent => ({
  kind: 'notification',
  recipientType: UserType.Staff,
  recipientId: 'staff-1',
  unseenCount: 3,
  notification: {
    id: 'n1',
    type: NotificationType.COURT_APPROVED,
    data: { courtId: 'c1' },
    createdAt: '2026-09-25T00:00:00.000Z',
  },
  ...overrides,
});

describe('NotificationsRealtimeService', () => {
  let redis: FakeRedis;
  let service: NotificationsRealtimeService;

  beforeEach(() => {
    redis = new FakeRedis();
    service = new NotificationsRealtimeService(redis as any);
    service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('subscribes to the shared channel on a duplicated connection', () => {
    expect(redis.subscriber).toBeDefined();
    expect(redis.subscriber!.subscribed).toEqual([
      NotificationsRealtimeService.CHANNEL,
    ]);
  });

  it('delivers a published event only to streams of that recipient', async () => {
    const received: RealtimeNotificationEvent[] = [];
    const other: RealtimeNotificationEvent[] = [];
    const sub1 = service
      .subscribe({ id: 'staff-1', type: UserType.Staff })
      .subscribe((e) => received.push(e));
    const sub2 = service
      .subscribe({ id: 'staff-1', type: UserType.Customer }) // same id, other type
      .subscribe((e) => other.push(e));

    await service.publish(event());

    expect(received).toHaveLength(1);
    expect(received[0].notification?.type).toBe(NotificationType.COURT_APPROVED);
    expect(received[0].unseenCount).toBe(3);
    expect(other).toHaveLength(0);

    sub1.unsubscribe();
    sub2.unsubscribe();
  });

  it('fans out to every open stream of the same recipient (two tabs)', async () => {
    const a: RealtimeNotificationEvent[] = [];
    const b: RealtimeNotificationEvent[] = [];
    const subA = service.subscribe({ id: 'staff-1', type: UserType.Staff }).subscribe((e) => a.push(e));
    const subB = service.subscribe({ id: 'staff-1', type: UserType.Staff }).subscribe((e) => b.push(e));
    expect(service.connectedStreams).toBe(2);

    await service.publish(event({ kind: 'count', unseenCount: 0, notification: undefined }));

    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0].kind).toBe('count');

    subA.unsubscribe();
    subB.unsubscribe();
    expect(service.connectedStreams).toBe(0);
  });

  it('still delivers locally when Redis publish fails', async () => {
    redis.failPublish = true;
    const received: RealtimeNotificationEvent[] = [];
    const sub = service.subscribe({ id: 'staff-1', type: UserType.Staff }).subscribe((e) => received.push(e));

    await expect(service.publish(event())).resolves.toBeUndefined();

    expect(received).toHaveLength(1);
    sub.unsubscribe();
  });

  it('stops delivering after the client goes away', async () => {
    const received: RealtimeNotificationEvent[] = [];
    const sub = service.subscribe({ id: 'staff-1', type: UserType.Staff }).subscribe((e) => received.push(e));
    sub.unsubscribe();

    await service.publish(event());

    expect(received).toHaveLength(0);
  });

  it('ignores malformed and unaddressed messages', () => {
    redis.subscriber!.emit('message', NotificationsRealtimeService.CHANNEL, '{not json');
    redis.subscriber!.emit('message', NotificationsRealtimeService.CHANNEL, JSON.stringify({ kind: 'count' }));
    expect(service.connectedStreams).toBe(0);
  });

  it('signals shutdown so open streams can end before the server closes', async () => {
    const seen: string[] = [];
    service.shutdown$.subscribe({ complete: () => seen.push('complete'), next: () => seen.push('next') });
    let completed = false;
    const sub = service
      .subscribe({ id: 'staff-1', type: UserType.Staff })
      .subscribe({ complete: () => (completed = true) });

    await service.onModuleDestroy();

    expect(seen).toEqual(['next', 'complete']);
    expect(completed).toBe(true);
    sub.unsubscribe();
  });

  it('closes the subscriber connection on shutdown', async () => {
    await service.onModuleDestroy();
    expect(redis.subscriber!.quitCalled).toBe(true);
  });
});
