import { SetMetadata } from '@nestjs/common';
import { LogAction, LogEntity } from '../modules/logging/entities/log.entity';

export const AUDITED_KEY = '__audited__';

export interface AuditedMetadata {
  entity: LogEntity;
  action: LogAction;
}

/**
 * Marks a mutating endpoint for audit logging. The AuditInterceptor writes
 * a log row with actor, ip, user agent and the request payload after the
 * handler completes successfully.
 */
export const Audited = (entity: LogEntity, action: LogAction) =>
  SetMetadata<string, AuditedMetadata>(AUDITED_KEY, { entity, action });
