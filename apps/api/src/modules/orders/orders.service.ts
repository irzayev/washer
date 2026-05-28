import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, StockMovementType, type VatMode } from '@washer/db';
import { Decimal } from 'decimal.js';
import { generateOrderNumber, money, round2, sumMoney } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { InvoicesService } from '../invoices/invoices.service';
import { OrdersGateway } from '../realtime/orders.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { CloseOrderDto } from './dto/close-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly invoices: InvoicesService,
    private readonly realtime: OrdersGateway,
  ) {}

  async list(branchId: string, status?: OrderStatus, page = 1, pageSize = 20) {
    const where: Prisma.OrderWhereInput = { branchId, deletedAt: null, ...(status ? { status } : {}) };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: true,
          vehicle: true,
          box: true,
          assignee: { select: { id: true, firstName: true, lastName: true } },
          items: { include: { service: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(branchId: string, id: string) {
    const o = await this.prisma.order.findFirst({
      where: { id, branchId, deletedAt: null },
      include: {
        client: { include: { bonusWallet: true } },
        vehicle: true,
        box: true,
        assignee: true,
        items: { include: { service: true, executor: true } },
        discounts: true,
        payments: true,
      },
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async create(branchId: string, dto: CreateOrderDto) {
    const services = await this.prisma.service.findMany({
      where: { id: { in: dto.items.map((i) => i.serviceId) } },
    });
    if (services.length !== dto.items.length) {
      throw new BadRequestException('Some services not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          number: generateOrderNumber(),
          branchId,
          clientId: dto.clientId,
          vehicleId: dto.vehicleId ?? null,
          boxId: dto.boxId ?? null,
          assignedToId: dto.assignedToId ?? null,
          notes: dto.notes ?? null,
          status: OrderStatus.NEW,
          items: {
            create: dto.items.map((i) => {
              const svc = services.find((s) => s.id === i.serviceId)!;
              return {
                serviceId: svc.id,
                priceSnapshot: svc.basePrice,
                qty: i.qty ?? 1,
                discount: i.discount ?? 0,
                executorId: i.executorId ?? null,
              };
            }),
          },
        },
      });

      const subtotal = round2(
        sumMoney(
          dto.items.map((i) =>
            money(services.find((s) => s.id === i.serviceId)!.basePrice).mul(i.qty ?? 1),
          ),
        ),
      );
      await tx.order.update({
        where: { id: order.id },
        data: { subtotal, grandTotal: subtotal },
      });

      const full = await tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: { include: { service: true } }, client: true, vehicle: true },
      });
      this.realtime.emitOrderCreated(branchId, { id: full.id, number: full.number, status: full.status });
      return full;
    });
  }

  async updateStatus(branchId: string, id: string, status: OrderStatus) {
    const order = await this.findOne(branchId, id);
    const next: Partial<Prisma.OrderUpdateInput> = { status };
    if (status === OrderStatus.IN_PROGRESS && !order.startedAt) next.startedAt = new Date();
    if (status === OrderStatus.DELIVERED) next.deliveredAt = new Date();
    const updated = await this.prisma.order.update({ where: { id }, data: next });
    this.realtime.emitOrderUpdated(branchId, { id, status, number: order.number });
    return updated;
  }

  async previewClose(
    branchId: string,
    id: string,
    dto: { bonusUsed?: number; discounts?: { type: 'FIXED' | 'PERCENT' | 'MANUAL'; value: number; reason: string }[] },
  ) {
    const order = await this.findOne(branchId, id);
    const branch = await this.prisma.branch.findUniqueOrThrow({ where: { id: branchId } });
    const pricing = this.pricing.compute({
      items: order.items.map((i) => ({
        priceSnapshot: i.priceSnapshot,
        qty: i.qty,
        discount: i.discount,
      })),
      discounts: dto.discounts,
      bonusUsedRequested: dto.bonusUsed,
      vatMode: branch.vatMode as VatMode,
      vatRate: branch.vatRate,
    });
    const wallet = order.client.bonusWallet;
    const bonusBalance = wallet ? Number(wallet.balance) : 0;
    const afterDiscount = pricing.subtotal.sub(pricing.discountTotal);
    const bonusMaxUsable = Decimal.min(money(bonusBalance), afterDiscount.mul(0.3)).toNumber();
    return {
      subtotal: pricing.subtotal.toNumber(),
      discountTotal: pricing.discountTotal.toNumber(),
      bonusUsed: pricing.bonusUsed.toNumber(),
      vatTotal: pricing.vatTotal.toNumber(),
      grandTotal: pricing.grandTotal.toNumber(),
      bonusEarned: pricing.bonusEarned.toNumber(),
      bonusBalance,
      bonusMaxUsable,
    };
  }

  /**
   * Close order: pricing -> payments -> bonuses -> stock -> notifications outbox.
   * Single Prisma transaction. Uses idempotencyKey on Payment.
   */
  async close(branchId: string, id: string, userId: string, dto: CloseOrderDto) {
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
    });
    if (existing) {
      return this.findOne(branchId, id);
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, branchId, deletedAt: null },
        include: { items: true, client: { include: { bonusWallet: true } }, branch: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.status === OrderStatus.DELIVERED) {
        throw new ConflictException('Order already delivered');
      }

      const branch = order.branch;
      const pricing = this.pricing.compute({
        items: order.items.map((i) => ({
          priceSnapshot: i.priceSnapshot,
          qty: i.qty,
          discount: i.discount,
        })),
        discounts: dto.discounts,
        bonusUsedRequested: dto.bonusUsed,
        vatMode: branch.vatMode as VatMode,
        vatRate: branch.vatRate,
      });

      const wallet = order.client.bonusWallet;
      if (pricing.bonusUsed.gt(0) && (!wallet || money(wallet.balance).lt(pricing.bonusUsed))) {
        throw new BadRequestException('Insufficient bonus balance');
      }

      const paymentsTotal = round2(sumMoney(dto.payments.map((p) => p.amount)));
      if (!paymentsTotal.equals(pricing.grandTotal)) {
        throw new BadRequestException(
          `Payments total ${paymentsTotal.toFixed(2)} != grandTotal ${pricing.grandTotal.toFixed(2)}`,
        );
      }

      const updated = await tx.order.update({
        where: { id, version: order.version },
        data: {
          status: OrderStatus.COMPLETED,
          completedAt: new Date(),
          subtotal: pricing.subtotal,
          discountTotal: pricing.discountTotal,
          bonusUsed: pricing.bonusUsed,
          vatTotal: pricing.vatTotal,
          grandTotal: pricing.grandTotal,
          bonusEarned: pricing.bonusEarned,
          version: { increment: 1 },
        },
      });

      for (const d of dto.discounts ?? []) {
        await tx.discount.create({
          data: {
            orderId: id,
            type: d.type,
            value: d.value,
            reason: d.reason,
            comment: d.comment ?? null,
            appliedById: userId,
          },
        });
      }

      const openShift = await tx.cashShift.findFirst({
        where: { branchId, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      for (let idx = 0; idx < dto.payments.length; idx++) {
        const p = dto.payments[idx]!;
        await tx.payment.create({
          data: {
            orderId: id,
            branchId,
            method: p.method,
            amount: p.amount,
            status: p.method === 'AZERICARD' ? 'PENDING' : 'SUCCEEDED',
            transactionRef: p.transactionRef ?? null,
            cashShiftId: p.method === 'CASH' && openShift ? openShift.id : null,
            capturedAt: p.method === 'AZERICARD' ? null : new Date(),
            idempotencyKey: idx === 0 ? dto.idempotencyKey : `${dto.idempotencyKey}-${idx}`,
          },
        });
      }

      if (pricing.bonusUsed.gt(0) && wallet) {
        await tx.bonusTransaction.create({
          data: {
            clientId: order.clientId,
            type: 'SPEND',
            amount: pricing.bonusUsed,
            sourceOrderId: id,
          },
        });
        await tx.bonusWallet.update({
          where: { clientId: order.clientId },
          data: {
            balance: { decrement: pricing.bonusUsed },
            lifetimeSpent: { increment: pricing.bonusUsed },
          },
        });
      }

      if (pricing.bonusEarned.gt(0)) {
        await tx.bonusTransaction.create({
          data: {
            clientId: order.clientId,
            type: 'EARN',
            amount: pricing.bonusEarned,
            sourceOrderId: id,
          },
        });
        await tx.bonusWallet.upsert({
          where: { clientId: order.clientId },
          create: {
            clientId: order.clientId,
            balance: pricing.bonusEarned,
            lifetimeEarned: pricing.bonusEarned,
          },
          update: {
            balance: { increment: pricing.bonusEarned },
            lifetimeEarned: { increment: pricing.bonusEarned },
          },
        });
      }

      await this.consumeStock(tx, branchId, id, userId);

      await tx.outboxEvent.create({
        data: {
          aggregate: 'order',
          aggregateId: id,
          type: 'order.closed',
          payload: {
            orderId: id,
            orderNumber: order.number,
            clientId: order.clientId,
            clientPhone: order.client.phone,
            grandTotal: pricing.grandTotal.toFixed(2),
            currency: branch.currency,
          },
        },
      });

      await this.invoices.ensureInvoice(id, order.number);

      const result = updated;
      setImmediate(() => this.realtime.emitOrderUpdated(branchId, { id, status: 'COMPLETED', number: order.number }));
      return result;
    });
  }

  private async consumeStock(
    tx: Prisma.TransactionClient,
    branchId: string,
    orderId: string,
    userId: string,
  ) {
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: {
        service: { include: { consumption: { include: { item: true } } } },
      },
    });

    for (const oi of orderItems) {
      for (const c of oi.service.consumption) {
        const qty = money(c.qty).mul(oi.qty);
        if (qty.lte(0)) continue;

        await tx.stockMovement.create({
          data: {
            branchId,
            itemId: c.itemId,
            type: StockMovementType.USAGE,
            qty: qty.toNumber(),
            unitCost: Number(c.item.costAvg),
            refOrderId: orderId,
            createdById: userId,
            note: `Order ${orderId}`,
          },
        });

        await tx.inventoryItem.update({
          where: { id: c.itemId },
          data: { stockQty: { decrement: qty.toNumber() } },
        });

        await tx.orderMaterialUsage.create({
          data: {
            orderItemId: oi.id,
            itemId: c.itemId,
            qtyPlanned: qty.toNumber(),
            qtyActual: qty.toNumber(),
            costSnapshot: c.item.costAvg,
          },
        });
      }
    }
  }
}
