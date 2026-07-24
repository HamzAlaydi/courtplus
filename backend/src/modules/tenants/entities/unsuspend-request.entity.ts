import { BaseEntity } from 'src/common/base-entity';
import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('unsuspend_requests')
@Index('unsuspend_request_tenant_id_idx', ['tenantId'])
export class UnsuspendRequest extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the tenant requesting to be unsuspended',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  tenantId: string;

  @ApiProperty({
    description: 'The message from the vendor explaining why the tenant should be unsuspended',
    example: 'We have fixed the issue with our court images',
  })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({
    description: 'The date when the request was resolved by ops',
    nullable: true,
    required: false,
  })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @ApiProperty({
    description: 'The tenant that submitted the request',
    type: () => Tenant,
  })
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;
}
