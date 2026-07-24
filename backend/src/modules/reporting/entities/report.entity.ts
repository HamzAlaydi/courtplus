import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
export enum ReportEntity {
  BOOKING = 'booking',
  USER = 'user',
  BRANCH = 'branch',
  COURT = 'court',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

@Entity('reports')
export class Report extends BaseEntity {
  @Column('uuid')
  reporterId: string;

  @Column('uuid')
  entityId: string;

  @Column({ type: 'enum', enumName: 'ReportEntity', enum: ReportEntity })
  entityType: ReportEntity;

  @Column()
  reason: string;

  @Column({ nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enumName: 'ReportStatus',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;
}
