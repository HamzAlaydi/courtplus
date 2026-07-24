import { Column, DeleteDateColumn, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';
import { StaffRole } from './enum';
import { BranchStaffer } from './branch-staffer.entity';

@Entity('staff')
@Index('idx_tenant_id', ['tenantId'])
@Index('idx_staff_email', ['email'], { unique: true })
@Index('idx_staff_phoneNumber', ['phoneNumber'])
export class Staffer extends BaseEntity {
  @ApiProperty({
    description: 'The first name of the staff',
    example: 'John',
  })
  @Column({ nullable: true })
  firstName?: string;

  @ApiProperty({
    description: 'The last name of the staff',
    example: 'Doe',
  })
  @Column({ nullable: true })
  lastName?: string;

  @ApiProperty({
    description: 'The email of the staff',
    example: 'test@test.com',
  })
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  pendingEmail?: string;

  @ApiProperty({
    description: 'The phone number of the staff',
    example: '+201000000000',
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  password?: string;

  @ApiProperty({
    description: 'The password of the staff',
    example: 'password123',
  })
  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  lastPasswordChangeAt?: Date;

  @ApiProperty({
    description: 'The verified at date of the staff',
    example: '2021-01-01',
  })
  @Column({ nullable: true })
  tenantId?: string;

  @ApiProperty({
    description: 'The tenant id of the staff',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({
    type: 'enum',
    enum: StaffRole,
    enumName: 'StaffRole',
  })
  role: StaffRole;


  @ApiProperty({
    description: 'The number of unseen notifications the user has',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  notificationsCount?: number = 0;


  @ManyToOne(() => Tenant, (tenant) => tenant.staff, { nullable: true })
  tenant?: Tenant;

  @ApiProperty({ type: () => [Booking] })
  @OneToMany(() => Booking, (booking) => booking.staff)
  bookings: Booking[];


  @ApiProperty({ type: () => [Branch] })
  @OneToMany(() => BranchStaffer, (branchStaffer) => branchStaffer.staffer)
  branches: BranchStaffer[];

  @DeleteDateColumn()
  deletedAt?: Date;
}
