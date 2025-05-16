import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new CustomLoggerService();

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      error: exception.name,
    };

    // Include validation errors if present
    if (typeof exceptionResponse === 'object' && 'errors' in exceptionResponse) {
      errorResponse['errors'] = exceptionResponse['errors'];
    }

    // Log the error with context
    this.logger.error(
      `HTTP Exception: ${exception.message}`,
      exception.stack,
      `${request.method} ${request.url}`
    );

    // Log request details for debugging
    this.logger.debug(
      `Request Details for ${request.method} ${request.url}`,
      undefined,
      {
        body: request.body,
        query: request.query,
        params: request.params,
        headers: request.headers,
      }
    );

    response.status(status).json(errorResponse);
  }
} 