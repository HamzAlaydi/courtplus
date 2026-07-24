import { BaseEntity } from 'src/common/base-entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { Participant } from 'src/modules/bookings/entities/participant.entity';

export enum PaymentProvider {
  STRIPE = 'stripe',
}

export enum PaymentType {
  WHOLE = 'whole',
  SPLIT = 'split',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_PAID = 'partially_paid',
  HOLD = 'hold',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  bookingId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;


  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidAmount?: number;

  @Column()
  currency: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  holdAmount?: number;

  @Column('jsonb', { nullable: true })
  data?: any;

  @Column({
    type: 'enum',
    enumName: 'PaymentStatus',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  providerPaymentId?: string;

  @Column({ nullable: true })
  providerCustomerId?: string;

  @Column({ nullable: true })
  paymentMethodId?: string;

  @Column({ nullable: true })
  refundId?: string;

  @Column({
    type: 'enum',
    enumName: 'PaymentProvider',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  provider: PaymentProvider;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @OneToOne(() => Participant, (participant) => participant.payment)
  participant?: Participant;
}
