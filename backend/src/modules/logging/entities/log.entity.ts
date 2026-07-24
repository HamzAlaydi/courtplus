import { BaseEntity } from 'src/common/base-entity';
import { UserType } from 'src/modules/auth/@types/user.type';
import { Column, Entity } from 'typeorm';

export enum LogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum LogEntity {
  USER = 'user',
  BOOKING = 'booking',
  REVIEW = 'review',
}

@Entity('logs')
export class Log extends BaseEntity {
  @Column({ type: 'jsonb', nullable: true })
  oldSnapshot?: any;

  @Column({ type: 'jsonb', nullable: true })
  newSnapshot?: any;

  @Column({ type: 'enum', enumName: 'LogAction', enum: LogAction })
  action: LogAction;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column({ type: 'enum', enumName: 'UserType', enum: UserType })
  userType?: UserType;

  @Column({ type: 'enum', enumName: 'LogEntity', enum: LogEntity })
  entity: LogEntity;
}
