import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto<T> {
  @ApiProperty({
    description: 'User token',
  })
  accessToken?: string;

  @ApiProperty({
    description: 'Refresh token',
  })
  refreshToken?: string;

  @ApiProperty({
    description: 'User',
    name: 'user',
  })
  user?: T;

  @ApiProperty({
    description: 'Requires verification',
  })
  requiresVerification?: boolean;
}
