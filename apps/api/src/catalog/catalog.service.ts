import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listCategories(includeInactive = false) {
    return this.prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: includeInactive ? undefined : { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const exists = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!exists) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.serviceCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const count = await this.prisma.service.count({
      where: { categoryId: id, isActive: true },
    });
    if (count > 0) {
      throw new BadRequestException(
        'Category has active services. Move or archive them first.',
      );
    }
    await this.prisma.serviceCategory.delete({ where: { id } });
    return { ok: true };
  }

  listServices(includeInactive = false) {
    return this.prisma.service.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: { name: 'asc' },
      include: { category: true },
    });
  }

  createService(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        durationMin: dto.durationMin,
        isPromo: dto.isPromo ?? false,
      },
      include: { category: true },
    });
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Service not found');
    }
    return this.prisma.service.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async archiveService(id: string) {
    const exists = await this.prisma.service.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Service not found');
    }
    // Soft delete: services are referenced by historical OrderLines.
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getService(id: string) {
    const s = await this.prisma.service.findUnique({ where: { id } });
    if (!s) {
      throw new NotFoundException('Service not found');
    }
    return s;
  }
}
