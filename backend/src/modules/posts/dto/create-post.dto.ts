import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'Post text content' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty({ description: 'Booking ID where the post is being created' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ description: 'Asset ID for post image', required: false })
  @IsUUID()
  @IsOptional()
  assetId?: string;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
