import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Log } from './entities/log.entity';
import { LogsService } from './logging.service';
import { LogsEvents } from './logs.events';
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [LogsService, LogsEvents],
  exports: [LogsService],
})
export class LogsModule {}
