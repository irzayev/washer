import { Injectable } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@washer/db';
import { startOfDayUTC, endOfDayUTC } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(branchId: string) {
    const today = new Date();
    const from = startOfDayUTC(today);
    const to = endOfDayUTC(today);

    const [activeOrders, todayOrders, todayRevenue, clientsCount, lowStock] = await Promise.all([
      this.prisma.order.count({
        where: { branchId, status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.WAITING, OrderStatus.SCHEDULED] } },
      }),
      this.prisma.order.count({ where: { branchId, openedAt: { gte: from, lte: to } } }),
      this.prisma.payment.aggregate({
        where: { branchId, status: PaymentStatus.SUCCEEDED, createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      this.prisma.client.count({ where: { branchId, deletedAt: null } }),
      this.prisma.$queryRawUnsafe<unknown[]>(
        `SELECT COUNT(*)::int AS c FROM "InventoryItem"
         WHERE "branchId" = $1::uuid AND "isActive" = true AND "stockQty" <= "minStock"`,
        branchId,
      ),
    ]);

    return {
      activeOrders,
      todayOrders,
      todayRevenue: todayRevenue._sum.amount ?? 0,
      clientsCount,
      lowStockItems: (lowStock[0] as { c: number } | undefined)?.c ?? 0,
    };
  }

  async revenueByDay(branchId: string, days = 30) {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.$queryRawUnsafe<{ day: Date; revenue: string }[]>(
      `SELECT date_trunc('day', "createdAt") AS day, SUM(amount)::text AS revenue
       FROM "Payment"
       WHERE "branchId" = $1::uuid AND status = 'SUCCEEDED' AND "createdAt" BETWEEN $2 AND $3
       GROUP BY 1 ORDER BY 1`,
      branchId,
      from,
      to,
    );
    return rows.map((r) => ({ day: r.day, revenue: Number(r.revenue) }));
  }

  async topServices(branchId: string, days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    return this.prisma.$queryRawUnsafe<{ name: string; count: string; revenue: string }[]>(
      `SELECT s.name, COUNT(*)::text AS count, SUM(oi."priceSnapshot" * oi.qty)::text AS revenue
       FROM "OrderItem" oi
       JOIN "Service" s ON s.id = oi."serviceId"
       JOIN "Order" o ON o.id = oi."orderId"
       WHERE o."branchId" = $1::uuid AND o.status = 'COMPLETED' AND o."completedAt" >= $2
       GROUP BY s.name ORDER BY SUM(oi."priceSnapshot" * oi.qty) DESC LIMIT 10`,
      branchId,
      from,
    );
  }

  async topEmployees(branchId: string, days = 30) {
    const from = new Date(Date.now() - days * 86400000);
    return this.prisma.$queryRawUnsafe<{ name: string; orders: string; revenue: string }[]>(
      `SELECT CONCAT(u."firstName", ' ', u."lastName") AS name,
              COUNT(DISTINCT o.id)::text AS orders,
              COALESCE(SUM(o."grandTotal"), 0)::text AS revenue
       FROM "Order" o
       JOIN "User" u ON u.id = o."assignedToId"
       WHERE o."branchId" = $1::uuid AND o.status = 'COMPLETED' AND o."completedAt" >= $2
       GROUP BY u.id, u."firstName", u."lastName"
       ORDER BY SUM(o."grandTotal") DESC LIMIT 10`,
      branchId,
      from,
    );
  }

  async boxLoad(branchId: string) {
    const boxes = await this.prisma.box.findMany({
      where: { branchId, isActive: true },
      include: {
        orders: {
          where: { status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.WAITING, OrderStatus.SCHEDULED] } },
        },
      },
    });
    return boxes.map((b) => ({ id: b.id, name: b.name, activeOrders: b.orders.length }));
  }
}
