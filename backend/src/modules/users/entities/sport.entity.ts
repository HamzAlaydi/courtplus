import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { User } from './user.entity';
import { JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Sport, SportLevel, TimePreference } from './enums';

@Entity('users_sports')
@Unique('idx_user_sport_user_id_name', ['userId', 'name'])
@Index('idx_user_sport_user_id', ['userId'])
export class UserSport extends BaseEntity {
  @ApiProperty({
    description: 'The name of the sport',
    enum: Sport,
    enumName: 'Sport',
    example: Sport.TENNIS,
  })
  @Column({
    type: 'enum',
    enum: Sport,
    enumName: 'Sport',
  })
  name: Sport;

  @ApiProperty({
    description: 'The skill level of the user in this sport',
    enum: SportLevel,
    enumName: 'SportLevel',
    example: SportLevel.INTERMEDIATE,
  })
  @Column({
    type: 'enum',
    enum: SportLevel,
    enumName: 'SportLevel',
  })
  level: SportLevel;

  @ApiProperty({
    description: 'The ID of the user this sport record belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'The preferred time of day for playing this sport',
    enum: TimePreference,
    enumName: 'TimePreference',
    example: TimePreference.EVENING,
  })
  @Column({
    type: 'enum',
    enum: TimePreference,
    enumName: 'TimePreference',
  })
  timePreference: TimePreference;

  @ApiProperty({
    description: 'The user this sport record belongs to',
    type: () => User,
  })
  @ManyToOne(() => User, (user) => user.sports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
