import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { SubscriptionStatus } from './enums';
import { PaymentProvider } from 'src/modules/payments/entities/payment.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {

  @Column('uuid')
  tenantId: string;

  @Column({ nullable: true })
  providerSubscriptionId?: string;

  @Column({ nullable: true })
  providerCustomerId?: string;

  @Column({ nullable: true })
  providerPriceId?: string;

  @Column({
    type: 'enum',
    enumName: 'PaymentProvider',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  provider: PaymentProvider;


  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 50 })
  pricePerUnit: number;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
