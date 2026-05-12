import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    user: AuthUser | undefined,
    action: string,
    metadata?: Record<string, unknown>,
    orderId?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId: user?.userId,
        orderId,
        action,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
