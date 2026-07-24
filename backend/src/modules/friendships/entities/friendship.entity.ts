import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('friendships')
@Index('idx_friendship_followerId', ['followerId'])
@Index('idx_friendship_followingId', ['followingId'])
@Index('idx_friendship_created', ['createdAt'])
@Index('idx_friendship_followerId_createdAt', ['followerId', 'createdAt'])
@Index('idx_friendship_followingId_createdAt', ['followingId', 'createdAt'])
@Unique('unique_friendship_followingId_followerId', [
  'followingId',
  'followerId',
])
@Unique('unique_friendship', ['followerId', 'followingId'])
export class Friendship extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the user who is following',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  followerId: string;

  @ApiProperty({
    description: 'The ID of the user being followed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  followingId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'followerId' })
  follower: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'followingId' })
  following: User;

  @ApiProperty({
    description: 'The user who is following',
    type: () =>
      PickType(User, [
        'id',
        'firstName',
        'lastName',
        'username',
        'avatarUrl',
        'isFollowing',
        'isFollowed',
      ]),
  })
  user?: User;
}
