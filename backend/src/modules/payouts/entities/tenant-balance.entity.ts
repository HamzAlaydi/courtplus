import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { moneyTransformer } from 'src/common/money.transformer';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';

@Entity('tenant_balances')
@Unique('uq_tenant_balances_tenantId', ['tenantId'])
export class TenantBalance extends BaseEntity {

  @Column('uuid')
  @Index()
  tenantId: string;

  // numeric, not float: binary floating point cannot represent 0.10 exactly,
  // so repeated `balance += net` drifted and the ledger never reconciled.
  // `transformer` is required because pg returns numeric as a string.
  @Column('numeric', { precision: 14, scale: 2, default: 0, transformer: moneyTransformer })
  availableBalance: number;

  @Column('numeric', { precision: 14, scale: 2, default: 0, transformer: moneyTransformer })
  pendingBalance: number;

  @Column('numeric', { precision: 14, scale: 2, default: 0, transformer: moneyTransformer })
  totalEarnings: number;

  @Column()
  currency: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
