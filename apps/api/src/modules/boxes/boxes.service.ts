import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BoxesService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId: string) {
    return this.prisma.box.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        orders: {
          where: { status: { in: ['IN_PROGRESS', 'WAITING', 'SCHEDULED'] } },
          select: { id: true, number: true, status: true },
        },
      },
    });
  }

  create(branchId: string, name: string) {
    return this.prisma.box.create({ data: { branchId, name } });
  }
}
