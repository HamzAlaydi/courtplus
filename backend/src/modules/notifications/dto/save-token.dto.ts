import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveTokenDto {
  @ApiProperty({
    description: 'The notification token for the user',
    example: 'fcm_token_123xyz',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
