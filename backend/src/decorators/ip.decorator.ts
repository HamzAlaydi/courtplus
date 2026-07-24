import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IpAddress = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return getIpAddress(ctx);
  },
);
export function getIpAddress(ctx: ExecutionContext) {
  const request: Request = ctx.switchToHttp().getRequest();
  const ip =
    request.headers['x-forwarded-for'] ||
    request.headers['x-real-ip'] ||
    request.socket.remoteAddress;

  if (typeof ip === 'string' && ip.includes(',')) {
    return ip.split(',')[0].trim();
  }

  return ip;
}
