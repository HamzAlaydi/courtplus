import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

/**
 * Best-effort distributed lock over Redis, for making scheduled jobs
 * single-runner across replicas.
 *
 * @nestjs/schedule runs every @Cron on every instance. Today the API is a
 * single container so that is invisible, but the moment a second replica
 * exists, the booking-completion sweep, the rate-reminder sweep and the asset
 * cleanup all fire twice — double notifications, and double side effects on
 * anything that credits money.
 *
 * Uses SET NX PX (single round trip, atomic) and releases with a Lua
 * compare-and-delete so an instance can never release a lock that has already
 * expired and been taken by someone else.
 *
 * This is not Redlock and does not survive a Redis failover; it is the right
 * weight for deduplicating periodic jobs, not for guarding money. Money-safe
 * mutual exclusion lives in Postgres (row locks, unique constraints).
 */
@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Run `task` only if this instance wins the lock. Returns true if it ran.
   *
   * @param ttlMs must comfortably exceed the task's worst-case runtime, or a
   *   second instance may start it while the first is still going.
   */
  async runExclusively(
    key: string,
    ttlMs: number,
    task: () => Promise<void>,
  ): Promise<boolean> {
    const lockKey = `lock#${key}`;
    const token = randomUUID();

    let acquired: string | null = null;
    try {
      acquired = await this.redis.set(lockKey, token, 'PX', ttlMs, 'NX');
    } catch (error) {
      // If Redis is unreachable, run anyway: skipping the sweep entirely is
      // worse than the (currently impossible) risk of a duplicate run.
      this.logger.error(
        `Lock acquisition failed for ${key}; running without the lock.`,
        error as Error,
      );
      await task();
      return true;
    }

    if (acquired !== 'OK') {
      this.logger.debug(`Skipping ${key} — another instance holds the lock.`);
      return false;
    }

    try {
      await task();
      return true;
    } finally {
      // Compare-and-delete: only release if we still own it.
      try {
        await this.redis.eval(
          `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`,
          1,
          lockKey,
          token,
        );
      } catch (error) {
        this.logger.warn(
          `Could not release lock ${key}; it will expire in ${ttlMs}ms.`,
        );
      }
    }
  }
}
