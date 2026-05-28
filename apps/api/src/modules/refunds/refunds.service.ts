import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@washer/db';
import { money } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRefundDto } from './dto/refund.dto';

@Injectable()
export class RefundsService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId: string) {
    return this.prisma.refund.findMany({
      where: { payment: { branchId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { payment: { include: { order: { select: { number: true, id: true } } } } },
    });
  }

  async create(branchId: string, dto: CreateRefundDto) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: dto.paymentId, branchId, status: PaymentStatus.SUCCEEDED },
      include: { refunds: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const refunded = payment.refunds
      .filter((r) => r.status === PaymentStatus.SUCCEEDED)
      .reduce((s, r) => s + Number(r.amount), 0);
    const available = money(payment.amount).sub(refunded);
    if (money(dto.amount).gt(available)) {
      throw new BadRequestException(`Max refundable: ${available.toFixed(2)}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const refund = await tx.refund.create({
        data: {
          paymentId: dto.paymentId,
          amount: dto.amount,
          reason: dto.reason,
          status: PaymentStatus.SUCCEEDED,
        },
      });
      const totalRefunded = refunded + dto.amount;
      if (money(totalRefunded).gte(payment.amount)) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.REFUNDED },
        });
      }
      return refund;
    });
  }
}
