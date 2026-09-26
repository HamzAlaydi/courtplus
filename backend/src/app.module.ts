import {
  ClassSerializerInterceptor,
  HttpException,
  HttpStatus,
  Module,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import configuration from './config/configuration';
import { APP_MODULES } from './modules';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ScheduleModule } from '@nestjs/schedule';
import Redis from 'ioredis';
import ms from 'ms';
import { validationSchema } from './config/validation';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Cacheable, CacheableMemory } from 'cacheable';
import { TOO_MANY_REQUESTS } from './modules/shared/error-codes';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AuditInterceptor } from './modules/logging/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    // Structured JSON in production so logs are parseable/searchable, with
    // timestamps and stack traces. format.simple() produced untimestamped,
    // unparseable lines with no level filtering, which made post-incident
    // analysis on the EC2 box essentially guesswork.
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      transports: [
        new winston.transports.Console({
          format:
            process.env.NODE_ENV === 'production'
              ? winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.errors({ stack: true }),
                  // Redact anything that looks like a credential before it
                  // reaches stdout — container logs are readable by anyone
                  // with shell access to the box.
                  winston.format((info) => {
                    const REDACT = /(password|token|secret|authorization|otp|code|card|cvv)/i;
                    const scrub = (v: unknown, depth = 0): unknown => {
                      if (depth > 4 || v === null || typeof v !== 'object') return v;
                      const out: Record<string, unknown> = Array.isArray(v) ? [] as any : {};
                      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
                        out[k] = REDACT.test(k) ? '[REDACTED]' : scrub(val, depth + 1);
                      }
                      return out;
                    };
                    return scrub(info) as winston.Logform.TransformableInfo;
                  })(),
                  winston.format.json(),
                )
              : winston.format.combine(
                  winston.format.timestamp({ format: 'HH:mm:ss' }),
                  winston.format.colorize(),
                  winston.format.simple(),
                ),
        }),
      ],
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Run pending migrations automatically on boot so deploys need no
        // manual migration step (Render Shell). synchronize stays off.
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsTableName: '_migrations',
        migrationsRun: true,
        // 'each' (rather than the default 'all') runs every migration in its
        // own transaction. A failure then leaves earlier migrations applied
        // instead of rolling back the whole batch, and it lets an individual
        // migration opt out entirely — required for CREATE INDEX CONCURRENTLY,
        // which cannot run inside a transaction block but is how indexes get
        // added to a live table without an ACCESS EXCLUSIVE lock.
        migrationsTransactionMode: 'each' as const,
      }),
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'auth',
            ttl: ms('15m'),
            limit: 6,
            blockDuration: ms('1h'),
          },
          {
            name: 'phone', ttl: ms('15m'), limit: 6, blockDuration: ms('15m'),
          },
        ],
        errorMessage(context, throttlerLimitDetail) {
          throw new HttpException(
            TOO_MANY_REQUESTS,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        },
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          }),
        ),
      }),
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: new Cacheable({
          primary: new Keyv({ store: new CacheableMemory() }),
          secondary: new KeyvRedis({
            socket: {
              host: configService.get('redis.host'),
              port: configService.get('redis.port'),
            },
          }),
        }),
      }),
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
      }),
    }),
    ...APP_MODULES,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: 'ADD_TRANSACTIONAL_DATA_SOURCE',
      useFactory: (dataSource: DataSource) => {
        addTransactionalDataSource(dataSource);
        return dataSource;
      },
      inject: [getDataSourceToken()],
    },
  ],
})
export class AppModule { }
