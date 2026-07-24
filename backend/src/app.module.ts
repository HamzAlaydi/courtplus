import {
  BadRequestException,
  ClassSerializerInterceptor,
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.simple(),
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
            name: 'phone',
            ttl: ms('15m'),
            limit: 6,
            blockDuration: ms('1h'),
          },
        ],
        errorMessage(context, throttlerLimitDetail) {
          throw new BadRequestException(TOO_MANY_REQUESTS);
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
