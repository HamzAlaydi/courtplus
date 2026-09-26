import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return getIpAddress(ctx);
  },
);

/**
 * Resolve the client IP.
 *
 * Uses Express's `req.ip`, which honours X-Forwarded-For ONLY according to the
 * `trust proxy` setting configured in main.ts (one hop — Caddy). That makes the
 * value trustworthy.
 *
 * This previously read `x-forwarded-for` straight off the raw headers and took
 * the first entry. Caddy *appends* to that header rather than replacing it, so
 * the first entry was whatever the client sent — fully attacker-controlled.
 * Two things depended on it:
 *   - rate-limit keys for login/OTP (an attacker rotated the header to get
 *     unlimited attempts), and
 *   - the audit trail (an attacker could forge any source IP in the logs).
 */
export function getIpAddress(ctx: ExecutionContext): string | undefined {
  const request: Request = ctx.switchToHttp().getRequest();
  return request.ip ?? request.socket?.remoteAddress;
}
