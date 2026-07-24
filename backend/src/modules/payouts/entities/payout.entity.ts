import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { PayoutStatus, PayoutProvider } from '../constants/payout.constants';

@Entity('payouts')
@Index(['tenantId', 'status'])
@Index(['status'])
@Index(['providerPayoutId'])
export class Payout extends BaseEntity {
  @Column('uuid')
  tenantId: string;

  @Column('float')
  amount: number;

  @Column()
  currency: string;

  @Column('enum', { enum: PayoutStatus, default: PayoutStatus.PENDING, enumName: 'PayoutStatus' })
  status: PayoutStatus;

  @Column('enum', { enum: PayoutProvider, enumName: 'PayoutProvider' })
  provider: PayoutProvider;

  @Column('varchar', { nullable: true })
  providerPayoutId: string;

  @Column('uuid')
  requestedByStaffId: string;

  @Column('timestamp', { nullable: true })
  sentAt: Date;

  @Column('text', { nullable: true })
  failureReason: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Staffer)
  @JoinColumn({ name: 'requestedByStaffId' })
  requestedBy: Staffer;

}
