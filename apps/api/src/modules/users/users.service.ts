import { Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UserRole } from '@washer/db';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId?: string) {
    return this.prisma.user.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { createdAt: 'desc' },
      select: this.publicSelect,
    });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        branchId: dto.branchId,
        passwordHash,
      },
      select: this.publicSelect,
    });
  }

  async findOne(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: this.publicSelect });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      delete data.password;
    }
    return this.prisma.user.update({ where: { id }, data, select: this.publicSelect });
  }

  private publicSelect = {
    id: true,
    email: true,
    phone: true,
    firstName: true,
    lastName: true,
    role: true,
    isActive: true,
    branchId: true,
    lastLoginAt: true,
    createdAt: true,
  } as const;
}
