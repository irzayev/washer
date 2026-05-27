import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CashShiftStatus, PaymentStatus } from '@washer/db';
import { money, round2 } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CashRegisterService {
  constructor(private readonly prisma: PrismaService) {}

  current(branchId: string) {
    return this.prisma.cashShift.findFirst({
      where: { branchId, status: CashShiftStatus.OPEN },
      orderBy: { openedAt: 'desc' },
    });
  }

  async open(branchId: string, userId: string, openingCash: number) {
    const existing = await this.current(branchId);
    if (existing) throw new ConflictException('Shift already open');
    return this.prisma.cashShift.create({
      data: { branchId, openedById: userId, openingCash, status: CashShiftStatus.OPEN },
    });
  }

  async close(branchId: string, userId: string, closingCash: number) {
    const shift = await this.current(branchId);
    if (!shift) throw new NotFoundException('No open shift');

    const cashPayments = await this.prisma.payment.aggregate({
      where: { cashShiftId: shift.id, method: 'CASH', status: PaymentStatus.SUCCEEDED },
      _sum: { amount: true },
    });
    const expected = round2(money(shift.openingCash).add(cashPayments._sum.amount ?? 0));
    const diff = round2(money(closingCash).sub(expected));

    return this.prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        status: CashShiftStatus.CLOSED,
        closedById: userId,
        closedAt: new Date(),
        closingCash,
        expectedCash: expected.toNumber(),
        diff: diff.toNumber(),
      },
    });
  }

  async report(shiftId: string) {
    const shift = await this.prisma.cashShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new NotFoundException('Shift not found');
    const totals = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { cashShiftId: shiftId, status: PaymentStatus.SUCCEEDED },
      _sum: { amount: true },
      _count: { _all: true },
    });
    return { shift, totals };
  }
}
