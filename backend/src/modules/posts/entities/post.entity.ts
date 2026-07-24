import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Asset } from 'src/modules/assets/entities/asset.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PostLike } from './post-like.entity';

@Entity('posts')
@Index('idx_post_bookingId', ['bookingId'])
@Index('idx_post_creatorId', ['userId'])
export class Post extends BaseEntity {
  @ApiProperty({
    description: 'The content/body of the booking post',
    example: 'This is a post about the booking',
  })
  @Column('text')
  body: string;

  @ApiProperty({
    description: 'The ID of the booking this post is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid', { nullable: true })
  bookingId?: string;

  @ApiProperty({
    description: 'The ID of the user who created this post',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'The ID of the asset (image/video) attached to this post',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @Column('uuid', { nullable: true })
  assetId?: string;

  @ApiProperty({
    description: 'The number of likes this post has received',
    example: 42,
    default: 0,
  })
  @Column({ default: 0 })
  likesCount: number;

  @ApiProperty({
    description: 'Whether the current user has liked this post',
    example: true,
    default: false,
  })
  isLiked: boolean;

  @ApiProperty({
    description: 'The URL of the asset (image/video) attached to this post',
    example: 'https://example.com/assets/image.jpg',
    required: false,
  })
  assetUrl?: string;

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @ApiProperty({
    description: 'The booking this post is associated with',
    type: () => Booking,
    required: false,
  })
  @ManyToOne(() => Booking, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @ApiProperty({
    description: 'The user who created this post',
    type: () => User,
  })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'The asset (image/video) attached to this post',
    type: () => Asset,
    required: false,
  })
  @OneToOne(() => Asset)
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;
}
