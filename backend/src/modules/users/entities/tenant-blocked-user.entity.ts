import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { User } from './user.entity';
import { Tenant } from 'src/modules/tenants/entities/tenant.entity';

/**
 * A customer barred from booking at ONE venue.
 *
 * Vendor staff used to call the platform-wide `PATCH /admin/users/:id/block`,
 * which sets `users.blockedAt` and locks the customer out of the whole app —
 * every other venue included. Any vendor could therefore ban any customer of
 * any competitor. Vendor-side blocking now writes here instead; the global
 * flag stays with SuperAdmin.
 */
@Entity('tenant_blocked_users')
@Unique('uq_tenant_blocked_user', ['tenantId', 'userId'])
export class TenantBlockedUser extends BaseEntity {
  @Column('uuid')
  @Index()
  tenantId: string;

  @Column('uuid')
  @Index()
  userId: string;

  /** Staff member who applied the block; kept for the audit trail. */
  @Column('uuid', { nullable: true })
  blockedByStaffId?: string;

  @Column({ nullable: true })
  reason?: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
