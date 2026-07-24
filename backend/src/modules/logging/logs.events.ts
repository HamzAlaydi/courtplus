import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LogsService } from './logging.service';

enum LogEvent {
  CREATE = 'create',
}
@Injectable()
export class LogsEvents {
  constructor(private readonly logsService: LogsService) {}

  @OnEvent(LogEvent.CREATE)
  async handleCreate(event: any) {}
}
