import { BaseEntity } from 'src/common/base-entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Column, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Booking } from 'src/modules/bookings/entities/booking.entity';

@Entity('reviews')
@Index('idx_review_userId', ['userId'])
@Unique('idx_review_userId_bookingId', ['userId', 'bookingId'])
export class Review extends BaseEntity {
  @ApiProperty({
    description: 'Rating score for the court',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @Column()
  rating: number;

  @ApiProperty({
    description: 'Comment about the court experience',
    example: 'Great court with good lighting',
  })
  @Column()
  comment: string;

  @ApiProperty({
    description: 'UUID of the user who created the review',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'UUID of the booking being reviewed',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @Column('uuid', { nullable: true })
  bookingId?: string;

  @ApiProperty({
    description: 'User who created the review',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    description: 'Booking that was reviewed',
    type: () => Booking,
    required: false,
  })
  @ManyToOne(() => Booking, (booking) => booking.reviews, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'bookingId' })
  booking?: Booking;

  @DeleteDateColumn()
  deletedAt?: Date;
}
