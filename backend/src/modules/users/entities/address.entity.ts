import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';

@Entity('addresses')
@Index('idx_address_user_id', ['userId'])
export class Address extends BaseEntity {
  @Column()
  street: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  postalCode?: string;

  @Column('uuid')
  userId: string;
}
