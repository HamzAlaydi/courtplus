import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index, Unique } from 'typeorm';

export enum VerificationContext {
  ACCOUNT_VERIFICATION = 'account_verification',
  PASSWORD_RESET = 'password_reset',
  EMAIL_VERIFICATION = 'email_verification',
  ACCOUNT_DELETION = 'account_deletion',
}

export enum VerificationChannel {
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('verifications')
@Unique('idx_verification_context', ['userId', 'context'])
@Index('idx_verification_identifier', ['identifier'])
export class Verification extends BaseEntity {
  @Column()
  identifier: string;

  @Column()
  value: string;

  @Column({
    type: 'enum',
    enum: VerificationChannel,
    enumName: 'VerificationChannel',
  })
  channel: VerificationChannel;

  @Column({
    type: 'enum',
    enum: VerificationContext,
    enumName: 'VerificationContext',
  })
  context: VerificationContext;

  @Column('uuid')
  userId: string;

  @Column()
  expiresAt: Date;
}
