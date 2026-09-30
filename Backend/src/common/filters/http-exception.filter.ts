import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error occurred.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = res.message || message;
        error = res.error || error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error [${request.method} ${request.url}]: ${exception.message}`,
        exception.stack,
      );
      // In production do not expose internal exception details
      message = 'An unexpected error occurred. Please try again later.';
    }

    // Format array of messages from class-validator cleanly
    const formattedMessage = Array.isArray(message)
      ? message.join(', ')
      : message;

    response.status(status).json({
      statusCode: status,
      error,
      message: formattedMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
