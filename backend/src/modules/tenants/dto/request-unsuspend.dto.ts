import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestUnsuspendDto {
  @ApiProperty({
    description: 'Message explaining why the tenant should be unsuspended',
    example: 'We have resolved the reported issues with our courts',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;
}
