import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { StaffRole } from './enum';
import { Branch } from 'src/modules/branches/entities/branch.entity';

export enum StaffInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('staff_invitations')
@Index('idx_staff_invitation_tenant_id', ['tenantId'])
@Index('idx_staff_invitation_email', ['email'])
@Index('idx_staff_invitation_token', ['token'], { unique: true })
export class StaffInvitation extends BaseEntity {
  @Column({ nullable: true })
  @ApiProperty({
    description: 'The email of the staff invitation',
    example: 'test@test.com',
  })
  email?: string;

  @Column({
    type: 'enum',
    enum: StaffInvitationStatus,
    enumName: 'StaffInvitationStatus',
    default: StaffInvitationStatus.PENDING,
  })
  @ApiProperty({
    description: 'The status of the staff invitation',
    example: StaffInvitationStatus.PENDING,
    enum: StaffInvitationStatus,
  })
  status: StaffInvitationStatus;

  @Column({ unique: true })
  token: string;

  @Column()
  expires: Date;

  @Column({
    type: 'enum',
    enum: StaffRole,
    enumName: 'StaffRole',
  })
  @ApiProperty({
    description: 'The role of the staff invitation',
    example: StaffRole.USER,
    enum: StaffRole,
  })
  role: StaffRole;

  @Column({ nullable: true })
  branchId?: string;

  @ManyToOne(() => Branch, { nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch?: Branch;

  @Column('uuid', { nullable: true })
  tenantId?: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant?: Tenant;
}
