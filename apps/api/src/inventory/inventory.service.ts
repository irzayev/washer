import { Injectable } from '@nestjs/common';
import { InventoryTxReason, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId?: string) {
    return this.prisma.inventoryItem.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async consumeForOrder(orderId: string, tx: Prisma.TransactionClient) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        lines: { include: { service: { include: { inventoryUsages: true } } } },
      },
    });
    if (!order) {
      return;
    }
    for (const line of order.lines) {
      for (const usage of line.service.inventoryUsages) {
        const delta = Number(usage.qtyPerOrder) * line.qty * -1;
        await tx.inventoryTransaction.create({
          data: {
            itemId: usage.itemId,
            orderId,
            reason: InventoryTxReason.ORDER_CONSUME,
            delta: new Prisma.Decimal(delta),
          },
        });
        await tx.inventoryItem.update({
          where: { id: usage.itemId },
          data: { quantity: { increment: new Prisma.Decimal(delta) } },
        });
      }
    }
  }
}
