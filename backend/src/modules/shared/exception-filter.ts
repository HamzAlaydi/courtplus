import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger(HttpExceptionFilter.name);
  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let status = 500;
    let code = exception.message ?? 'INTERNAL_SERVER_ERROR';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const message = exception.getResponse()['message'];
      code = Array.isArray(message) ? message[0] : message;
    } else {
      status = 500;
      code = 'INTERNAL_SERVER_ERROR';
    }

    if (status !== 401) {
      this.logger.error(exception.message, exception.stack);
    }
    response.status(status).json({
      statusCode: status,
      code,
    });
  }
}
