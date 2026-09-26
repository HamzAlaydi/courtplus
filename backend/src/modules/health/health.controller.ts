import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { IsPublic } from 'src/decorators/is-public';

/**
 * Liveness and readiness probes.
 *
 * Previously there was no health endpoint at all: the Render blueprint
 * health-checked the Swagger docs page and the Docker api service had no
 * healthcheck, so a Postgres or Redis outage looked perfectly healthy and a
 * deploy would report success while the API was unable to serve a request.
 */
@Controller('health')
@ApiExcludeController()
@IsPublic()
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Liveness: is the process up? Deliberately does NOT touch dependencies —
   * a DB blip must not cause the orchestrator to kill and restart a healthy
   * process, which would turn a brief outage into a restart loop.
   */
  @Get()
  live() {
    return { status: 'ok', uptime: Math.floor(process.uptime()) };
  }

  /**
   * Readiness: can this instance actually serve traffic? Checks the two hard
   * dependencies. Use this one for the load balancer / container healthcheck.
   */
  @Get('ready')
  async ready() {
    const checks: Record<string, string> = {};

    try {
      await this.dataSource.query('SELECT 1');
      checks.database = 'ok';
    } catch (error) {
      checks.database = `error: ${(error as Error).message}`;
    }

    try {
      const pong = await this.redis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : `unexpected: ${pong}`;
    } catch (error) {
      checks.redis = `error: ${(error as Error).message}`;
    }

    const healthy = Object.values(checks).every((v) => v === 'ok');
    if (!healthy) {
      throw new ServiceUnavailableException({ status: 'error', checks });
    }

    return { status: 'ok', checks };
  }
}
