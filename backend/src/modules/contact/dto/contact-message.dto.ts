import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactMessageDto {
  @ApiProperty({
    description: 'Full name of the person reaching out',
    example: 'Ahmed Ali',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    description: 'Email address to reply to',
    example: 'ahmed@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Optional subject or topic of the message',
    required: false,
    example: 'Facility onboarding',
    maxLength: 300,
  })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  subject?: string;

  @ApiProperty({
    description: 'The message body',
    example: 'I would like to list my padel facility on Court+.',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000)
  message: string;
}
