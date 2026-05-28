import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, PayrollModelType } from '@washer/db';
import { money, round2 } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalaryRunDto, UpsertPayrollProfileDto } from './dto/payroll.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  listProfiles(branchId: string) {
    return this.prisma.payrollProfile.findMany({
      where: { user: { branchId } },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });
  }

  upsertProfile(dto: UpsertPayrollProfileDto) {
    return this.prisma.payrollProfile.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        modelType: dto.modelType,
        params: dto.params as object,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      },
      update: { modelType: dto.modelType, params: dto.params as object },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  listRuns(branchId: string) {
    return this.prisma.salaryRun.findMany({
      where: { branchId },
      orderBy: { periodFrom: 'desc' },
      include: { items: true },
      take: 24,
    });
  }

  async createRun(branchId: string, dto: CreateSalaryRunDto) {
    const from = new Date(dto.periodFrom);
    const to = new Date(dto.periodTo);
    if (to <= from) throw new BadRequestException('periodTo must be after periodFrom');

    const profiles = await this.prisma.payrollProfile.findMany({
      where: { user: { branchId, isActive: true }, OR: [{ endsAt: null }, { endsAt: { gte: from } }] },
      include: { user: true },
    });

    const completedOrders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: OrderStatus.COMPLETED,
        completedAt: { gte: from, lte: to },
      },
      include: { items: true },
    });

    const branchRevenue = completedOrders.reduce((s, o) => s + Number(o.grandTotal), 0);

    const items = profiles.map((p) => {
      const params = p.params as Record<string, number>;
      let base = 0;
      let bonus = 0;
      const employeeOrders = completedOrders.filter((o) => o.assignedToId === p.userId);
      const employeeRevenue = employeeOrders.reduce((s, o) => s + Number(o.grandTotal), 0);

      switch (p.modelType) {
        case PayrollModelType.FIXED:
          base = params.salary ?? params.base ?? 0;
          break;
        case PayrollModelType.PERCENT:
          base = round2(money(employeeRevenue).mul((params.percent ?? 10) / 100)).toNumber();
          break;
        case PayrollModelType.PERCENT_PLUS_BONUS:
          base = round2(money(branchRevenue).mul((params.percent ?? 5) / 100)).toNumber();
          bonus = params.bonus ?? 0;
          break;
        case PayrollModelType.KPI:
          base = params.base ?? 0;
          bonus = employeeOrders.length >= (params.ordersTarget ?? 20) ? (params.kpiBonus ?? 50) : 0;
          break;
      }

      const deductions = params.deductions ?? 0;
      const total = round2(money(base).add(bonus).sub(deductions)).toNumber();
      return {
        employeeId: p.userId,
        base,
        bonus,
        deductions,
        total,
        details: { employeeRevenue, ordersCount: employeeOrders.length, modelType: p.modelType },
      };
    });

    return this.prisma.salaryRun.create({
      data: {
        branchId,
        periodFrom: from,
        periodTo: to,
        status: 'calculated',
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async getRun(branchId: string, id: string) {
    const run = await this.prisma.salaryRun.findFirst({
      where: { id, branchId },
      include: { items: true },
    });
    if (!run) throw new NotFoundException('Salary run not found');
    return run;
  }
}
