import { Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  async recordCompletedOrder(
    params: {
      branchId: string;
      payments: { method: PaymentMethod; amountCents: number }[];
      discountCents: number;
      bonusCents: number;
      revenueCents: number;
    },
    tx: Prisma.TransactionClient,
  ) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    const agg = {
      cashCents: 0,
      posCents: 0,
      azericardCents: 0,
      bankCents: 0,
      bonusCents: params.bonusCents,
      discountCents: params.discountCents,
      revenueCents: params.revenueCents,
    };
    for (const p of params.payments) {
      if (p.method === PaymentMethod.CASH) {
        agg.cashCents += p.amountCents;
      } else if (p.method === PaymentMethod.POS) {
        agg.posCents += p.amountCents;
      } else if (p.method === PaymentMethod.AZERICARD) {
        agg.azericardCents += p.amountCents;
      } else if (p.method === PaymentMethod.BANK_TRANSFER) {
        agg.bankCents += p.amountCents;
      }
    }
    await tx.cashRegisterDay.upsert({
      where: {
        branchId_day: { branchId: params.branchId, day },
      },
      create: {
        branchId: params.branchId,
        day,
        ...agg,
      },
      update: {
        cashCents: { increment: agg.cashCents },
        posCents: { increment: agg.posCents },
        azericardCents: { increment: agg.azericardCents },
        bankCents: { increment: agg.bankCents },
        bonusCents: { increment: agg.bonusCents },
        discountCents: { increment: agg.discountCents },
        revenueCents: { increment: agg.revenueCents },
      },
    });
  }

  summary(branchId: string | undefined, from: Date, to: Date) {
    return this.prisma.cashRegisterDay.findMany({
      where: {
        branchId: branchId ?? undefined,
        day: { gte: from, lte: to },
      },
      orderBy: { day: 'asc' },
    });
  }
}
