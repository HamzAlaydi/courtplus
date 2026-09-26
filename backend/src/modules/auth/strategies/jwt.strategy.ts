import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { SessionUser } from '../@types/session';

/**
 * Key for a session that has been logged out or revoked. Entries self-expire
 * after the longest possible access-token lifetime, so the denylist stays
 * small and needs no cleanup job.
 */
export const revokedSessionKey = (sid: string) => `revoked-session#${sid}`;
export const REVOKED_SESSION_TTL_MS = 60 * 60 * 1000; // 1h — covers the longest access token

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  /**
   * This used to return the token payload unchecked, which meant logout did
   * nothing to the access token: a revoked session — including an ops operator
   * whose access had just been pulled — kept working until the token expired.
   *
   * Checking a Redis denylist keeps this to one fast lookup per request rather
   * than a database round trip.
   */
  async validate(payload: SessionUser): Promise<SessionUser> {
    if (payload?.sid) {
      try {
        const revoked = await this.cacheManager.get(revokedSessionKey(payload.sid));
        if (revoked) {
          throw new UnauthorizedException('SESSION_REVOKED');
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        // Fail open on a cache outage rather than logging every user out.
        // Exposure is bounded by the access-token lifetime.
        this.logger.error(
          `Revoked-session lookup failed for sid ${payload.sid}; allowing request.`,
          error as Error,
        );
      }
    }

    return payload;
  }
}
