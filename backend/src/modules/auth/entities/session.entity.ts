import { BaseEntity } from 'src/common/base-entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Staffer } from 'src/modules/staff/entities/staff.entity';
import { Entity, Column, Index } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from 'src/modules/users/entities/enums';

export enum SessionStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity('sessions')
@Index('idx_session_userId', ['userId'])
export class Session extends BaseEntity {
  @Column()
  refreshToken: string;

  @ApiPropertyOptional({
    description: 'The IP address of the client',
    example: '192.168.1.1',
    required: false,
  })
  @Column({ nullable: true })
  ip?: string;

  @ApiPropertyOptional({
    description: 'The user agent string of the client browser',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    required: false,
  })
  @Column({ nullable: true })
  userAgent?: string;

  @ApiProperty({
    description: 'The current status of the session',
    enum: SessionStatus,
    example: SessionStatus.ACTIVE,
  })
  @Column({
    default: SessionStatus.ACTIVE,
    type: 'enum',
    enum: SessionStatus,
    enumName: 'SessionStatus',
  })
  status: SessionStatus;

  @ApiPropertyOptional({
    description: 'The language of the user',
    example: 'en',
  })
  @Column({
    nullable: true,
    type: 'enum',
    enum: Language,
    enumName: 'Language',
  })
  language?: Language;

  @ApiProperty({
    description: 'The expiration date and time of the session',
    example: '2024-12-31T23:59:59Z',
  })
  @Column({ type: 'timestamp with time zone' })
  expiresAt: Date;

  @ApiProperty({
    description: 'The ID of the user this session belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  userId: string;

  @Column({ nullable: true })
  fcmToken?: string;

  @ApiPropertyOptional({
    description: 'The device ID associated with this session',
    example: 'device-123-abc',
    required: false,
  })
  @Column({ nullable: true })
  deviceId?: string;

  @ApiProperty({
    description: 'The associated user or staff member',
    type: () => User,
  })
  user: User | Staffer;
}
