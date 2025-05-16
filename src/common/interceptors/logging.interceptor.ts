import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new CustomLoggerService();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params, headers } = request;
    const user = request.user ? `[User: ${request.user.email}]` : '[Unauthenticated]';
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      `📥 Incoming Request: ${method} ${url} ${user}`,
      undefined,
      {
        body: this.sanitizeBody(body),
        query,
        params,
        headers: this.sanitizeHeaders(headers),
      }
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          this.logger.log(
            `📤 Response: ${method} ${url} ${user} - ${responseTime}ms`,
            undefined,
            {
              statusCode: 200,
              responseTime: `${responseTime}ms`,
              responseData: this.sanitizeResponse(data),
            }
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          this.logger.error(
            `❌ Error: ${method} ${url} ${user} - ${responseTime}ms`,
            error.stack,
            'Error',
            {
              statusCode: error.status || 500,
              responseTime: `${responseTime}ms`,
              error: {
                message: error.message,
                name: error.name,
                status: error.status,
              },
            }
          );
        },
      }),
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'refreshToken'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private sanitizeResponse(data: any): any {
    if (!data) return data;
    if (Array.isArray(data)) {
      return `[Array with ${data.length} items]`;
    }
    if (typeof data === 'object') {
      const sanitized = { ...data };
      const sensitiveFields = ['password', 'token', 'refreshToken'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      return sanitized;
    }
    return data;
  }
} 