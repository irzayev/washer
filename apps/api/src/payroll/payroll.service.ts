import { Injectable, NotFoundException } from '@nestjs/common';
import { PayrollModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  listProfiles() {
    return this.prisma.payrollProfile.findMany({ include: { user: true } });
  }

  async upsertProfile(
    userId: string,
    data: {
      model: PayrollModel;
      baseCents?: number;
      percentBp?: number;
      notes?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.payrollProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  listRuns(profileId: string) {
    return this.prisma.payrollRun.findMany({
      where: { profileId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
