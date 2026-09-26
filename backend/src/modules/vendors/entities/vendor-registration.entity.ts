import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { StaffInvitation } from 'src/modules/staff/entities/staff-invitation.entity';

export enum VendorRegistrationStatus {
  /** Link emailed, vendor has not completed signup yet. */
  PENDING = 'pending',
  /** Vendor redeemed the link and a tenant now exists. */
  COMPLETED = 'completed',
  /** Superseded by a newer request for the same email. */
  SUPERSEDED = 'superseded',
}

/**
 * A facility owner's request to join Court+ from the marketing site.
 *
 * Kept separate from StaffInvitation on purpose: the invitation carries the
 * token and auth semantics, this row carries the *business* details the vendor
 * typed (facility name, phone, city) plus a durable record for sales. The
 * previous implementation emailed those details to an inbox and stored
 * nothing, so a lost or spam-filed email meant a lost lead with no way to
 * recover it.
 */
@Entity('vendor_registrations')
@Index('idx_vendor_registration_email', ['email'])
@Index('idx_vendor_registration_status', ['status'])
export class VendorRegistration extends BaseEntity {
  @Column()
  email: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column()
  facilityName: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({
    type: 'enum',
    enum: VendorRegistrationStatus,
    enumName: 'VendorRegistrationStatus',
    default: VendorRegistrationStatus.PENDING,
  })
  status: VendorRegistrationStatus;

  /** The invitation whose token was emailed to this vendor. */
  @Column('uuid', { nullable: true })
  invitationId?: string;

  @ManyToOne(() => StaffInvitation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invitationId' })
  invitation?: StaffInvitation;

  /** Set when the vendor redeems the link and the tenant is created. */
  @Column('uuid', { nullable: true })
  tenantId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;
}
