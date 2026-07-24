import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('blocks')
@Index('idx_block_blockerId', ['blockerId'])
@Index('idx_block_blockedId', ['blockedId'])
@Index('idx_block_created', ['createdAt'])
@Unique('unique_block', ['blockerId', 'blockedId'])
export class Block extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the user who blocked',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  blockerId: string;

  @ApiProperty({
    description: 'The ID of the user who was blocked',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  blockedId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'blockedId' })
  blocked: User;

  @ApiProperty({
    description: 'The blocked user details',
    type: () =>
      PickType(User, [
        'id',
        'firstName',
        'lastName',
        'username',
        'avatarUrl',
      ]),
  })
  user?: User;
}
