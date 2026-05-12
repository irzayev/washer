import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const inProgress = await this.prisma.order.count({
      where: { status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.WAITING] } },
    });
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const revenueAgg = await this.prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: { gte: since },
      },
      _sum: { finalTotalCents: true },
    });
    const topStaff = await this.prisma.order.groupBy({
      by: ['assigneeId'],
      where: {
        paymentStatus: PaymentStatus.COMPLETED,
        completedAt: { gte: since },
        assigneeId: { not: null },
      },
      _sum: { finalTotalCents: true },
      _count: true,
      orderBy: { _sum: { finalTotalCents: 'desc' } },
      take: 5,
    });
    return {
      ordersInProgress: inProgress,
      revenueLast30dCents: revenueAgg._sum.finalTotalCents ?? 0,
      topStaff,
    };
  }
}
