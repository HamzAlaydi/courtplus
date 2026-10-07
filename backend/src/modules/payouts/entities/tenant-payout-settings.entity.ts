import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { PayoutProvider } from '../constants/payout.constants';

@Entity('tenant_payout_settings')
@Index(['tenantId'])
export class TenantPayoutSettings extends BaseEntity {
  @Column('uuid')
  @Index({ unique: true })
  tenantId: string;

  @Column('enum', { enum: PayoutProvider, default: PayoutProvider.STRIPE, enumName: 'PayoutProvider' })
  provider: PayoutProvider;

  @Column({ nullable: true })
  providerAccountId?: string;

  @Column('boolean', { default: false })
  isActive: boolean;

  // Optional: a Connect-managed payout has no bank details on our side. This
  // was NOT NULL, so creating a settings row during Stripe onboarding failed
  // AFTER the Express account had been created (500 + orphaned account).
  @Column({ nullable: true })
  bankName?: string;

  @Column({ nullable: true })
  accountHolderName?: string;

  @Column({ nullable: true })
  iban?: string;

  @Column({ nullable: true })
  accountNumber?: string;

  @Column({ nullable: true })
  sortCode?: string;

  @Column({ nullable: true })
  swiftCode?: string;

  @Column({ length: 2, nullable: true })
  bankCountry?: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
