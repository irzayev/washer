import { BadRequestException, Injectable } from '@nestjs/common';
import { BonusTxType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CASHBACK_BP = 500; // 5%
const MAX_BONUS_ORDER_BP = 3000; // 30%

@Injectable()
export class BonusesService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(clientId: string) {
    return this.prisma.clientBonusWallet.upsert({
      where: { clientId },
      create: { clientId },
      update: {},
    });
  }

  /** Rules: no bonus spend if any line is promo; max 30% of (subtotal - discount). */
  assertSpendAllowed(
    subtotalCents: number,
    discountCents: number,
    bonusUsedCents: number,
    lines: { isPromo: boolean }[],
  ) {
    if (bonusUsedCents <= 0) {
      return;
    }
    if (lines.some((l) => l.isPromo)) {
      throw new BadRequestException(
        'Bonuses cannot be used when the order contains promotional services',
      );
    }
    const afterDiscount = Math.max(0, subtotalCents - discountCents);
    const maxBonus = Math.floor((afterDiscount * MAX_BONUS_ORDER_BP) / 10_000);
    if (bonusUsedCents > maxBonus) {
      throw new BadRequestException(
        `Bonus cannot exceed ${maxBonus / 100} AZN for this order`,
      );
    }
  }

  async spend(
    clientId: string,
    orderId: string,
    amountCents: number,
    tx: Prisma.TransactionClient,
  ) {
    if (amountCents <= 0) {
      return;
    }
    const wallet = await tx.clientBonusWallet.upsert({
      where: { clientId },
      create: { clientId },
      update: {},
    });
    if (wallet.balanceCents < amountCents) {
      throw new BadRequestException('Insufficient bonus balance');
    }
    await tx.clientBonusWallet.update({
      where: { clientId },
      data: {
        balanceCents: { decrement: amountCents },
        lifetimeSpent: { increment: amountCents },
      },
    });
    await tx.bonusTransaction.create({
      data: {
        clientId,
        type: BonusTxType.SPEND,
        amountCents,
        sourceOrderId: orderId,
      },
    });
  }

  /** 5% cashback on money portion (final - bonus used), only from non-promo lines share. */
  async earnCashback(
    clientId: string,
    orderId: string,
    finalTotalCents: number,
    bonusUsedCents: number,
    lines: { lineTotalCents: number; isPromo: boolean }[],
    tx: Prisma.TransactionClient,
  ) {
    const nonPromoSubtotal = lines
      .filter((l) => !l.isPromo)
      .reduce((s, l) => s + l.lineTotalCents, 0);
    if (nonPromoSubtotal <= 0) {
      return;
    }
    const moneyPaid = Math.max(0, finalTotalCents - bonusUsedCents);
    if (moneyPaid <= 0) {
      return;
    }
    const share =
      nonPromoSubtotal / lines.reduce((s, l) => s + l.lineTotalCents, 0);
    const earnBase = Math.floor(moneyPaid * share);
    const earn = Math.floor((earnBase * CASHBACK_BP) / 10_000);
    if (earn <= 0) {
      return;
    }
    await tx.clientBonusWallet.upsert({
      where: { clientId },
      create: { clientId, balanceCents: earn, lifetimeEarned: earn },
      update: {
        balanceCents: { increment: earn },
        lifetimeEarned: { increment: earn },
      },
    });
    await tx.bonusTransaction.create({
      data: {
        clientId,
        type: BonusTxType.EARN,
        amountCents: earn,
        sourceOrderId: orderId,
        note: 'cashback',
      },
    });
  }
}
