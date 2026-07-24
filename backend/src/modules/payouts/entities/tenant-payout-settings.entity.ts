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

  @Column()
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
