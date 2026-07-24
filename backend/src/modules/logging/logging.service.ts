import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, LogAction, LogEntity } from './entities/log.entity';
import { isEqual, omit, pickBy } from 'lodash';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log) private readonly logsRepository: Repository<Log>,
  ) {}

  async createLog(
    oldValue: any,
    newValue: any,
    action: LogAction,
    entity: LogEntity,
  ) {
    const log = new Log();
    log.oldSnapshot = this.getDifferenceInObjects(
      this.removeTimestamps(oldValue),
      this.removeTimestamps(newValue),
    );
    log.newSnapshot = this.getDifferenceInObjects(
      this.removeTimestamps(newValue),
      this.removeTimestamps(oldValue),
    );
    log.action = action;
    log.entity = entity;
    await this.logsRepository.save(log);
  }

  private removeTimestamps(object: any, fields: string[] = []): any {
    return omit(object, ['createdAt', 'updatedAt', ...fields]);
  }

  private getDifferenceInObjects(
    newObject: any,
    oldObject: any,
  ): { [key: string]: any } {
    return pickBy(newObject, (v, k) => !isEqual(oldObject[k], v));
  }
}
