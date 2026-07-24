import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { SessionUser } from 'src/modules/auth/@types/session';
import { REFRESH_TOKEN_REQUIRED } from 'src/modules/shared/error-codes';
@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request) {
    const authHeader = request?.headers?.authorization;

    if (!authHeader) {
      throw new UnauthorizedException(REFRESH_TOKEN_REQUIRED);
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(REFRESH_TOKEN_REQUIRED);
    }

    const refreshToken = parts[1];

    if (!refreshToken || refreshToken.trim() === '') {
      throw new UnauthorizedException(REFRESH_TOKEN_REQUIRED);
    }

    const session =
      await this.authService.getSessionByRefreshToken(refreshToken);

    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      type: session.user.type,
      sid: session.id,
      role: session.user.role,
      tenantId: session.user.tenantId,
    } satisfies SessionUser;
  }
}
