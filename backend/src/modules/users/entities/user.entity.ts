import { Column, Entity, Unique, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { UserSport } from './sport.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Bookmark } from 'src/modules/bookmarks/entities/bookmark.entity';
import { Participant } from 'src/modules/bookings/entities/participant.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { Review } from 'src/modules/reviews/entities/review.entity';
import { BookingEvent } from 'src/modules/bookings/entities/event.entity';
import { Gender } from './enums';
import { UserPreferences } from './user-preferences.entity';

export type UserCountKey =
  | 'followersCount'
  | 'followingCount'
  | 'bookingsCount'
  | 'minutesBookedCount'
  | 'reviewsCount'
  | 'totalSpent'
  | 'postsCount';

@Entity('users')
@Unique('idx_user_username', ['username'])
@Unique('idx_user_email', ['email'])
@Unique('idx_user_phoneNumber', ['phoneNumber'])
export class User extends BaseEntity {
  @ApiProperty({
    description: 'The first name of the user',
    example: 'John',
    nullable: true,
  })
  @Column({ nullable: true })
  firstName?: string;

  @ApiProperty({
    description: 'The last name of the user',
    example: 'Doe',
    nullable: true,
  })
  @Column({ nullable: true })
  lastName?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
    nullable: true,
  })
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({
    description: 'The pending email address of the user',
    example: 'john.doe@example.com',
    nullable: true,
  })
  @Column({ nullable: true })
  pendingEmail?: string;

  @Column({ nullable: true })
  emailVerified?: Date;

  @ApiProperty({
    description: 'The biography of the user',
    example: 'Tennis enthusiast since 2010',
    nullable: true,
  })
  @Column({ nullable: true })
  bio?: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+12025550179',
    nullable: true,
  })
  @Column({ nullable: true })
  phoneNumber?: string;

  @ApiProperty({
    description: 'The pending phone number of the user',
    example: '+12025550179',
    nullable: true,
  })
  @Column({ nullable: true })
  pendingPhoneNumber?: string;

  @ApiProperty({
    description: 'The URL of the user avatar',
    example: 'https://example.com/avatars/johndoe.jpg',
    nullable: true,
  })
  @Column({ nullable: true })
  avatarUrl?: string;

  @ApiProperty({
    description: 'The URL of the user cover image',
    example: 'https://example.com/covers/johndoe.jpg',
    nullable: true,
  })
  coverUrl?: string;

  @ApiProperty({
    description: 'The date when the user was verified',
    example: '2023-01-15T12:00:00Z',
    nullable: true,
  })
  @Column({ nullable: true })
  verifiedAt?: Date;

  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
    nullable: true,
  })
  @Column({ nullable: true })
  username?: string;

  @ApiProperty({
    description: 'The date of birth of the user',
    example: '1990-05-15',
    nullable: true,
  })
  @Column({ nullable: true })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'The gender of the user',
    enum: Gender,
    enumName: 'Gender',
    example: Gender.MALE,
    nullable: true,
  })
  @Column({
    type: 'enum',
    enum: Gender,
    enumName: 'Gender',
    nullable: true,
  })
  gender?: Gender;

  @ApiProperty({
    description: 'The Firebase UID of the user',
    example: 'firebase123456',
    nullable: true,
  })
  @Column({ nullable: true })
  firebaseUid?: string;

  @ApiProperty({
    description: 'The Stripe Customer ID of the user',
    example: 'stripe123456',
    nullable: true,
  })
  @Column({ nullable: true })
  stripeCustomerId?: string;


  @ApiProperty({
    description: 'The number of unseen notifications the user has',
    example: 10,
    nullable: true,
  })
  @Column({ nullable: true })
  notificationsCount?: number = 0;

  @ApiProperty({
    description: 'The number of followers the user has',
    example: 150,
    nullable: true,
  })
  @Column({ default: 0 })
  followersCount: number = 0;

  @ApiProperty({
    description: 'The number of users the user is following',
    example: 75,
    nullable: true,
  })
  @Column({ default: 0 })
  followingCount: number = 0;

  @ApiProperty({
    description: 'The number of bookings played by the user',
    example: 42,
    nullable: true,
  })
  @Column({ default: 0 })
  bookingsCount: number;

  @ApiProperty({
    description: 'The total minutes played by the user',
    example: 2520,
    nullable: true,
  })
  @Column({ default: 0 })
  minutesBookedCount: number;

  @ApiProperty({
    description: 'The total number of reviews the user has',
    example: 10,
    nullable: true,
  })
  @Column({ default: 0 })
  reviewsCount: number;

  @ApiProperty({
    description: 'The total amount of money the user has spent',
    example: 1000,
    nullable: true,
  })
  @Column({ default: 0 })
  totalSpent: number;

  @ApiProperty({
    description: 'The total number of posts created by the user',
    example: 25,
    nullable: true,
  })
  @Column({ default: 0 })
  postsCount: number;

  @ApiProperty({
    description: 'Whether the current user is following this user',
    example: false,
    nullable: true,
  })
  isFollowing?: boolean;

  @ApiProperty({
    description: 'Whether this user is following the current user',
    example: true,
    nullable: true,
  })
  isFollowed?: boolean;

  @Column({ nullable: true })
  deletedAt?: Date;

  @ApiProperty({
    description: 'The date when the user was blocked by admin',
    example: '2023-01-15T12:00:00Z',
    nullable: true,
  })
  @Column({ nullable: true })
  blockedAt?: Date;

  get fullName(): string {
    return `${this.firstName ?? ''} ${this.lastName ?? ''}`.trim();
  }

  @ApiProperty({
    description: 'The sports played by the user',
    type: () => [UserSport],
    nullable: true,
  })
  @OneToMany(() => UserSport, (sport) => sport.user)
  sports?: UserSport[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks?: Bookmark[];

  @OneToMany(() => Participant, (participant) => participant.user)
  participants?: Participant[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings?: Booking[];

  @OneToMany(() => Review, (review) => review.user)
  reviews?: Review[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments?: Payment[];

  @OneToMany(() => BookingEvent, (event) => event.user)
  bookingEvents?: BookingEvent[];


  @OneToOne(() => UserPreferences, (preferences) => preferences.user)
  preferences?: UserPreferences;

}
