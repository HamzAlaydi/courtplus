import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { INVALID_USERNAME } from 'src/modules/shared/error-codes';
export class CheckUsernameDto {
  @ApiProperty({
    description:
      'Username to check availability minimum 3 characters, maximum 50 characters, only alphanumeric characters and underscore, dot, dash',
    example: 'johndoe',
  })
  @IsString({ message: INVALID_USERNAME })
  @MinLength(3, { message: INVALID_USERNAME })
  @MaxLength(50, { message: INVALID_USERNAME })
  @Matches(/^[a-zA-Z0-9_.-]+$/, { message: INVALID_USERNAME })
  username: string;
}

export class CheckUsernameResponseDto {
  @ApiProperty({
    description: 'Whether the username is available',
    example: false,
  })
  available: boolean;

  @ApiProperty({
    description:
      'Alternative username suggestions if requested username is taken',
    example: ['johndoe123', 'john.doe', 'johndoe_2'],
  })
  suggestions?: string[];
}
