import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiscountType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { BonusesService } from '../bonuses/bonuses.service';
import { CashRegisterService } from '../cash-register/cash-register.service';
import { InventoryService } from '../inventory/inventory.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CloseOrderDto } from './dto/close-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { SetDiscountDto, UpdateOrderDto } from './dto/update-order.dto';

function discountCents(
  subtotal: number,
  type: DiscountType | null,
  value: number | null,
): number {
  if (!type || value == null) {
    return 0;
  }
  if (type === DiscountType.FIXED || type === DiscountType.MANUAL) {
    return Math.min(subtotal, value);
  }
  if (type === DiscountType.PERCENT) {
    return Math.floor((subtotal * value) / 100);
  }
  return 0;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly bonuses: BonusesService,
    private readonly inventory: InventoryService,
    private readonly cashRegister: CashRegisterService,
    private readonly notifications: NotificationsService,
  ) {}

  list() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        client: true,
        vehicle: true,
        lines: { include: { service: true } },
      },
    });
  }

  async get(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        vehicle: true,
        lines: { include: { service: true } },
        payments: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async create(dto: CreateOrderDto) {
    const lineCreates = await Promise.all(
      dto.lines.map(async (l) => {
        const svc = await this.prisma.service.findUnique({
          where: { id: l.serviceId },
        });
        if (!svc || !svc.isActive) {
          throw new BadRequestException(`Invalid service ${l.serviceId}`);
        }
        const lineTotal = svc.priceCents * l.qty;
        return {
          serviceId: l.serviceId,
          qty: l.qty,
          unitPriceCents: svc.priceCents,
          lineTotalCents: lineTotal,
        };
      }),
    );
    const subtotal = lineCreates.reduce((s, l) => s + l.lineTotalCents, 0);
    const order = await this.prisma.order.create({
      data: {
        clientId: dto.clientId,
        vehicleId: dto.vehicleId,
        branchId: dto.branchId,
        assigneeId: dto.assigneeId,
        subtotalCents: subtotal,
        finalTotalCents: subtotal,
        lines: { create: lineCreates },
      },
    });
    await this.recalculate(order.id);
    return this.get(order.id);
  }

  async update(id: string, dto: UpdateOrderDto, user: AuthUser) {
    const before = await this.get(id);
    await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        assigneeId: dto.assigneeId,
        notes: dto.notes,
        branchId: dto.branchId,
        ...(dto.bonusUsedCents != null
          ? { bonusUsedCents: dto.bonusUsedCents }
          : {}),
      },
    });
    await this.audit.log(
      user,
      'order.update',
      { before: before.status, after: dto.status },
      id,
    );
    if (dto.status && dto.status !== before.status) {
      const client = await this.prisma.client.findUnique({
        where: { id: before.clientId },
      });
      if (client?.phone) {
        await this.notifications.enqueueWhatsapp(client.phone, 'order_status', {
          orderId: id,
          status: dto.status,
        });
      }
    }
    if (dto.bonusUsedCents != null) {
      return this.recalculate(id);
    }
    return this.get(id);
  }

  async setDiscount(id: string, dto: SetDiscountDto, user: AuthUser) {
    await this.get(id);
    await this.prisma.order.update({
      where: { id },
      data: {
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        discountReason: dto.discountReason,
        discountComment: dto.discountComment,
      },
    });
    await this.audit.log(
      user,
      'order.discount',
      {
        type: dto.discountType,
        value: dto.discountValue,
        reason: dto.discountReason,
        comment: dto.discountComment,
      },
      id,
    );
    return this.recalculate(id);
  }

  async recalculate(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const subtotal = order.lines.reduce((s, l) => s + l.lineTotalCents, 0);
    const disc = discountCents(
      subtotal,
      order.discountType,
      order.discountValue,
    );
    const afterDisc = Math.max(0, subtotal - disc);
    const bonusUsed = order.bonusUsedCents;
    const final = Math.max(0, afterDisc - bonusUsed);
    return this.prisma.order.update({
      where: { id },
      data: { subtotalCents: subtotal, finalTotalCents: final },
      include: { lines: { include: { service: true } }, client: true },
    });
  }

  async close(id: string, dto: CloseOrderDto, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { lines: { include: { service: true } }, client: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (
      order.status === OrderStatus.DELIVERED ||
      order.paymentStatus === PaymentStatus.COMPLETED
    ) {
      throw new BadRequestException('Order already closed');
    }
    const branchId = order.branchId;
    if (!branchId) {
      throw new BadRequestException(
        'Order must have branchId set before closing (cash register)',
      );
    }

    const bonusUsed = dto.bonusUsedCents ?? order.bonusUsedCents;
    await this.prisma.order.update({
      where: { id },
      data: { bonusUsedCents: bonusUsed },
    });
    const fresh = await this.recalculate(id);
    const lines = fresh.lines.map((l) => ({ isPromo: l.service.isPromo }));
    const subtotal = fresh.subtotalCents;
    const disc = discountCents(
      subtotal,
      fresh.discountType,
      fresh.discountValue,
    );
    this.bonuses.assertSpendAllowed(subtotal, disc, bonusUsed, lines);

    const finalTotal = fresh.finalTotalCents;
    if (
      dto.payments.some(
        (p) =>
          p.method === PaymentMethod.MIXED || p.method === PaymentMethod.BONUS,
      )
    ) {
      throw new BadRequestException(
        'Use concrete methods (cash/card/bank); bonuses are applied via bonusUsedCents',
      );
    }
    const paid = dto.payments.reduce((s, p) => s + p.amountCents, 0);
    if (paid !== finalTotal) {
      throw new BadRequestException(
        `Payments (${paid}) must equal final total (${finalTotal})`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const p of dto.payments) {
        await tx.payment.create({
          data: {
            orderId: id,
            method: p.method,
            amountCents: p.amountCents,
            status: PaymentStatus.COMPLETED,
          },
        });
      }
      await tx.order.update({
        where: { id },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          status: OrderStatus.DELIVERED,
          completedAt: new Date(),
        },
      });
      await this.bonuses.spend(order.clientId, id, bonusUsed, tx);
      await this.bonuses.earnCashback(
        order.clientId,
        id,
        finalTotal,
        bonusUsed,
        fresh.lines.map((l) => ({
          lineTotalCents: l.lineTotalCents,
          isPromo: l.service.isPromo,
        })),
        tx,
      );
      await this.inventory.consumeForOrder(id, tx);
      await this.cashRegister.recordCompletedOrder(
        {
          branchId,
          payments: dto.payments.map((p) => ({
            method: p.method,
            amountCents: p.amountCents,
          })),
          discountCents: disc,
          bonusCents: bonusUsed,
          revenueCents: finalTotal,
        },
        tx,
      );
    });

    await this.audit.log(
      user,
      'order.close',
      { payments: dto.payments, bonusUsed },
      id,
    );
    if (order.client.phone) {
      await this.notifications.enqueueWhatsapp(
        order.client.phone,
        'order_completed',
        {
          orderId: id,
          totalAzn: finalTotal / 100,
        },
      );
    }
    await this.notifications.enqueuePdf(id);

    return this.get(id);
  }
}
