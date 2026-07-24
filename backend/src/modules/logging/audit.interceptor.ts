import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { omit } from 'lodash';
import { AUDITED_KEY, AuditedMetadata } from 'src/decorators/audited.decorator';
import { LogsService } from './logging.service';
import { getIpAddress } from 'src/decorators/ip.decorator';

const SENSITIVE_BODY_FIELDS = [
  'password',
  'currentPassword',
  'newPassword',
  'token',
  'code',
];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly logsService: LogsService,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.getAllAndOverride<AuditedMetadata>(
      AUDITED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const ip = getIpAddress(context);
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(() => {
        this.logsService
          .logRequest({
            action: metadata.action,
            entity: metadata.entity,
            user: request.user,
            ip: typeof ip === 'string' ? ip : undefined,
            userAgent,
            payload: {
              params: request.params,
              body: request.body
                ? omit(request.body, SENSITIVE_BODY_FIELDS)
                : undefined,
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
