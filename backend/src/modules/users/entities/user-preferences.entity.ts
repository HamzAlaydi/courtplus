import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationSettingsDto } from '../dto/user-preferences.dto';
import { Language } from './enums';
import { User } from './user.entity';

@Entity('user_preferences')
@Index(['userId', 'deviceId'], { unique: true })
export class UserPreferences extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the user these user preferences belong to',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'The ID of the device these user preferences belong to',
  })
  @Column()
  deviceId: string;

  @ApiProperty({
    description: 'JSON object containing user preferences',
  })
  @Column({
    type: 'jsonb'
  })
  notifications: NotificationSettingsDto = {
    followers: true,
    likes: true,
    openBookings: true,
    bookingActivity: true,
    updates: true,
    nearbyCourts: true,
  };

  @ApiProperty({
    description: 'The language of the user',
    enum: Language,
    enumName: 'Language',
    example: Language.EN,
    default: Language.EN,
  })
  @Column({ type: 'enum', enum: Language, enumName: 'Language', default: Language.EN })
  language: Language = Language.EN;


  @ApiProperty({
    description: 'The currency of the user',
    example: 'USD',
  })
  @Column({ default: 'USD' })
  currency: string = 'USD';

  @ApiProperty({
    description: 'The user this user preferences belong to',
    type: () => User,
  })
  @OneToOne(() => User, (user) => user.preferences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
