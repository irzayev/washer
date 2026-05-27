import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    const method: string = req.method;
    const path: string = req.path ?? req.url ?? '';

    if (!WRITE_METHODS.has(method) || SKIP_PATHS.some((p) => path.endsWith(p))) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const user = req.user;
        if (!user?.id) return;
        const entity = path.split('/').filter(Boolean).slice(2, 3)[0] ?? 'unknown';
        void this.prisma.auditLog
          .create({
            data: {
              actorId: user.id,
              action: `${method} ${path}`,
              entity,
              entityId: (response as { id?: string })?.id ?? req.params?.id ?? null,
              diff: req.body ? { body: req.body } : undefined,
              ip: req.ip,
              userAgent: req.headers?.['user-agent']?.toString().slice(0, 255),
            },
          })
          .catch(() => undefined);
      }),
    );
  }
}
