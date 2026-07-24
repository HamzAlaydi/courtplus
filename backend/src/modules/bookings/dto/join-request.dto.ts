import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateIf,
  IsUUID,
} from 'class-validator';

export class JoinRequestDto {
  @ApiProperty({
    description: 'UUID of the participant',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID()
  participantId: string;

  @ApiProperty({
    description: 'Whether to accept or reject  booking participation',
  })
  @IsBoolean()
  accept: boolean;

  @ApiProperty({
    description: 'The reason for rejecting booking participation',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((object) => !object.accept)
  rejectionReason?: string;
}
