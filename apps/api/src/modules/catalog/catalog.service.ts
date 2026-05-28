import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // categories
  listCategories() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }
  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }
  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  // services
  listServices(branchId?: string) {
    return this.prisma.service.findMany({
      where: {
        isActive: true,
        ...(branchId
          ? { OR: [{ branchId: null }, { branchId }] }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: true },
    });
  }
  async findService(id: string) {
    const s = await this.prisma.service.findUnique({ where: { id }, include: { category: true } });
    if (!s) throw new NotFoundException('Service not found');
    return s;
  }
  createService(dto: CreateServiceDto) {
    return this.prisma.service.create({ data: dto });
  }
  updateService(id: string, dto: UpdateServiceDto) {
    return this.prisma.service.update({ where: { id }, data: dto });
  }
}
