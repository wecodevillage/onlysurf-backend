import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SentryService } from './sentry.service';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, query, params } = request;

    // Add breadcrumb for the request
    this.sentryService.addBreadcrumb({
      message: `${method} ${url}`,
      level: 'info',
      data: {
        method,
        url,
        query,
        params,
      },
    });

    // Set user context if available
    if (user) {
      this.sentryService.setUser({
        id: user.id,
        email: user.email,
      });
    }

    return next.handle().pipe(
      catchError((error) => {
        // Only capture exceptions that are not HTTP exceptions with status < 500
        // or capture all exceptions based on your preference
        if (error instanceof HttpException) {
          const status = error.getStatus();
          if (status >= 500) {
            this.sentryService.captureException(error, {
              request: {
                method,
                url,
                body: this.sanitizeBody(body),
                query,
                params,
              },
              user: user
                ? { id: user.id, email: user.email }
                : { id: 'anonymous' },
            });
          }
        } else {
          // Capture all non-HTTP exceptions
          this.sentryService.captureException(error, {
            request: {
              method,
              url,
              body: this.sanitizeBody(body),
              query,
              params,
            },
            user: user
              ? { id: user.id, email: user.email }
              : { id: 'anonymous' },
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return throwError(() => error);
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    // Remove sensitive fields
    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'creditCard',
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
