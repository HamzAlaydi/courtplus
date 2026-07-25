import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from './tenant.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('tenant_preferences')
export class TenantPreferences extends BaseEntity {
  @ApiProperty({
    description: 'The currency code for the tenant',
    example: 'SAR',
  })
  @Column({ default: 'SAR' })
  currency: string;

  @Column()
  tenantId: string;

  @OneToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
}
