import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        branchId: dto.branchId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async ensureBootstrapAdmin() {
    const count = await this.prisma.user.count();
    if (count > 0) {
      return;
    }
    const branch = await this.prisma.branch.create({ data: { name: 'Main' } });
    const passwordHash = await bcrypt.hash('Admin123!', 10);
    await this.prisma.user.create({
      data: {
        email: 'admin@edetailing.local',
        passwordHash,
        role: UserRole.ADMIN,
        firstName: 'Admin',
        branchId: branch.id,
      },
    });
  }

  async ensureSeedData() {
    await this.ensureBootstrapAdmin();
    const categories = await this.prisma.serviceCategory.count();
    if (categories === 0) {
      const cat = await this.prisma.serviceCategory.create({
        data: { name: 'Wash', slug: 'wash', sortOrder: 0 },
      });
      await this.prisma.service.create({
        data: {
          categoryId: cat.id,
          name: 'Premium Wash',
          description: 'Exterior + vacuum',
          priceCents: 2500,
          durationMin: 45,
        },
      });
    }
  }
}
