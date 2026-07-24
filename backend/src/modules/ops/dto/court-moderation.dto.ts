import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CourtModerationDto {
  @ApiProperty({
    description: 'The reason shown to the vendor',
    example: 'Court images are outdated, please upload recent photos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
