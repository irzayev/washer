import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.branch.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: { name: dto.name, timezone: dto.timezone ?? 'Asia/Baku' },
    });
  }
}
