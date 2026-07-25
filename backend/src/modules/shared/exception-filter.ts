import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

import { Response } from 'express';
import { DUPLICATE_ENTRY } from './error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = 500;
    let code: string = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : exceptionResponse['message'] ?? exceptionResponse['code'];
      code = (Array.isArray(message) ? message[0] : message) ?? exception.message;
    } else if (exception instanceof QueryFailedError) {
      // TypeORM driver errors: map the identifiable ones, hide the rest
      // (full details stay in the server logs below).
      const driverCode = (exception as QueryFailedError).driverError?.['code'];
      if (driverCode === '23505') {
        status = 409;
        code = DUPLICATE_ENTRY;
      }
    }
    // Any other raw Error stays a generic 500 — internals are never leaked.

    if (status !== 401) {
      this.logger.error(exception.message, exception.stack);
    }
    response.status(status).json({
      statusCode: status,
      code,
    });
  }
}
