import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

export enum SchedulesEvent {
  ScheduleCreated = 'schedule.created',
  ScheduleUpdated = 'schedule.updated',
}

interface ScheduleCreatedEvent {
  scheduleId: string;
}

@Injectable()
export class SchedulesEvents {
  private readonly logger = new Logger(SchedulesEvents.name);

  @OnEvent(SchedulesEvent.ScheduleCreated)
  handleScheduleCreatedEvent(event: ScheduleCreatedEvent) {
    this.logger.log(`Schedule created: ${event.scheduleId}`);
  }
}
