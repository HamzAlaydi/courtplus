import { BaseEntity } from 'src/common/base-entity';
import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Tenant } from './tenant.entity';

/** How ops closed an unsuspend request. */
export enum UnsuspendRequestOutcome {
  APPROVED = 'approved',
  DENIED = 'denied',
}

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
    description:
      'How the request was closed. Null while the request is still pending.',
    enum: UnsuspendRequestOutcome,
    nullable: true,
    required: false,
  })
  @Column({
    type: 'enum',
    enum: UnsuspendRequestOutcome,
    enumName: 'UnsuspendRequestOutcome',
    nullable: true,
  })
  outcome?: UnsuspendRequestOutcome;

  @ApiProperty({
    description: 'Why ops denied the request; shown to the vendor',
    nullable: true,
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  resolutionReason?: string;

  @ApiProperty({
    description: 'The tenant that submitted the request',
    type: () => Tenant,
  })
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;
}
