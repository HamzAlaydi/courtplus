import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';

@Entity('tenant_balances')
export class TenantBalance extends BaseEntity {

  @Column('uuid')
  @Index()
  tenantId: string;

  @Column('float', { default: 0 })
  availableBalance: number;

  @Column('float', { default: 0 })
  pendingBalance: number;

  @Column('float', { default: 0 })
  totalEarnings: number;

  @Column()
  currency: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
