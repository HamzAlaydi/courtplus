import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log, LogAction, LogEntity } from './entities/log.entity';
import { isEqual, omit, pickBy } from 'lodash';
import type { SessionUser } from '../auth/@types/session';
import { UserType } from '../auth/@types/user.type';

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

  async logRequest({
    action,
    entity,
    user,
    ip,
    userAgent,
    payload,
  }: {
    action: LogAction;
    entity: LogEntity;
    user?: SessionUser;
    ip?: string;
    userAgent?: string;
    payload?: Record<string, any>;
  }) {
    const log = new Log();
    log.action = action;
    log.entity = entity;
    log.userId = user?.id;
    log.userType = user?.type;
    log.actorStaffId = user?.type === UserType.Staff ? user.id : undefined;
    log.actorEmail = user?.email;
    log.ip = ip;
    log.userAgent = userAgent;
    log.newSnapshot = payload ?? null;
    await this.logsRepository.save(log);
  }

  async listLogs({
    page = 1,
    pageSize = 10,
    actorStaffId,
    actorEmail,
    entity,
    action,
    from,
    to,
  }: {
    page?: number;
    pageSize?: number;
    actorStaffId?: string;
    actorEmail?: string;
    entity?: LogEntity;
    action?: LogAction;
    from?: string;
    to?: string;
  }) {
    const queryBuilder = this.logsRepository.createQueryBuilder('log');

    if (actorStaffId) {
      queryBuilder.andWhere('log.actorStaffId = :actorStaffId', {
        actorStaffId,
      });
    }
    if (actorEmail) {
      queryBuilder.andWhere('log.actorEmail ILIKE :actorEmail', {
        actorEmail: `%${actorEmail}%`,
      });
    }
    if (entity) {
      queryBuilder.andWhere('log.entity = :entity', { entity });
    }
    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }
    if (from) {
      queryBuilder.andWhere('log.createdAt >= :from', { from });
    }
    if (to) {
      queryBuilder.andWhere('log.createdAt <= :to', { to });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      items: logs,
      pagination: {
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
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
