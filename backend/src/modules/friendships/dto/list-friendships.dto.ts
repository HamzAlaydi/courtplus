import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { PaginationInputDto } from 'src/common/pagination.input.dto';

export enum FriendshipType {
  FOLLOWERS = 'followers',
  FOLLOWING = 'following',
}

export class ListFriendshipsDto extends PaginationInputDto {
  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'The ID of the user to list friendships for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The search query to filter friendships',
    example: 'John',
    required: false,
  })
  search?: string;

  @IsEnum(FriendshipType)
  @IsOptional()
  @ApiProperty({
    description: 'The type of friendships to list',
    example: FriendshipType.FOLLOWING,
    required: false,
  })
  type?: FriendshipType = FriendshipType.FOLLOWERS;
}
