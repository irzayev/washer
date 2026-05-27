import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BonusesService {
  constructor(private readonly prisma: PrismaService) {}

  async wallet(clientId: string) {
    return this.prisma.bonusWallet.upsert({
      where: { clientId },
      create: { clientId },
      update: {},
    });
  }

  history(clientId: string) {
    return this.prisma.bonusTransaction.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
