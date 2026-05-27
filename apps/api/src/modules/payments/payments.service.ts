import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  listByOrder(orderId: string) {
    return this.prisma.payment.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }

  listByBranch(branchId: string, from?: Date, to?: Date) {
    return this.prisma.payment.findMany({
      where: {
        branchId,
        ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
