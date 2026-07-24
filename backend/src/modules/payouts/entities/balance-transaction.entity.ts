import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Payout } from './payout.entity';
import { TransactionType } from '../constants/payout.constants';

@Entity('balance_transactions')
@Index(['tenantId', 'createdAt'])
@Index(['type'])
export class BalanceTransaction extends BaseEntity {
  @Column('uuid')
  tenantId: string;

  @Column('enum', { enum: TransactionType, enumName: 'TransactionType' })
  type: TransactionType;

  @Column('float')
  amount: number;

  @Column()
  currency: string;

  @Column('uuid', { nullable: true })
  bookingId?: string;

  @Column('uuid', { nullable: true })
  payoutId?: string;

  @Column('uuid', { nullable: true })
  paymentId?: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @ManyToOne(() => Payout)
  @JoinColumn({ name: 'payoutId' })
  payout: Payout;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;
}
