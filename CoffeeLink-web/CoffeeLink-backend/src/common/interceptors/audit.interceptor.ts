import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditTrail');

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, user, ip } = request;

    // Only Audit State-Changing Methods (POST, PUT, PATCH, DELETE)
    // Ignore GET to avoid spamming read logs (unless critical)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          try {
            const userId = (user as any)?.id || null;
            const resource = url.split('/')[3] || 'ROOT'; // /api/v1/resource/...

            // Sanitize
            const metadata = this.sanitizeBody(body);

            // Persist to Database (Fintech Requirement)
            await this.prisma.auditLog.create({
                data: {
                    userId: userId,
                    action: method,
                    resource: resource,
                    resourceId: null, // Hard to extract generically without specific response parsing
                    ip: ip || 'unknown',
                    userAgent: request.headers['user-agent'] || 'unknown',
                    metadata: metadata
                }
            });

            this.logger.log(`[AUDIT] User:${userId} performed ${method} on ${resource}`);

          } catch (e) {
            this.logger.error(`Failed to write audit log: ${e.message}`);
          }
        }),
      );
    }

    return next.handle();
  }

  private sanitizeBody(body: any) {
    if (!body) return {};
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'creditCard', 'cvv'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) sanitized[key] = '[REDACTED]';
    });
    
    return sanitized;
  }
}