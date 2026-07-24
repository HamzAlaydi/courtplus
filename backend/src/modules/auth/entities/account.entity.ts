import { BaseEntity } from 'src/common/base-entity';
import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum AccountProvider {
  EMAIL = 'email',
  PHONE = 'phone',
  GOOGLE = 'google',
  APPLE = 'apple',
}

@Entity('accounts')
@Index('idx_account_userId', ['userId'])
export class Account extends BaseEntity {
  @ApiProperty({
    description: 'The ID of the user this account belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column('uuid')
  userId: string;

  @ApiProperty({
    description: 'The authentication provider for this account',
    enum: AccountProvider,
    example: AccountProvider.EMAIL,
  })
  @Column({
    type: 'enum',
    enum: AccountProvider,
    enumName: 'AccountProvider',
  })
  provider: AccountProvider;
}
