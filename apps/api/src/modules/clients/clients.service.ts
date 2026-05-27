import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@washer/db';
import { normalizeAzPhone, isValidAzPhone } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(branchId: string, q?: string, page = 1, pageSize = 20) {
    const where: Prisma.ClientWhereInput = {
      branchId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { vehicles: true, bonusWallet: true },
      }),
      this.prisma.client.count({ where }),
    ]);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async findOne(branchId: string, id: string) {
    const c = await this.prisma.client.findFirst({
      where: { id, branchId, deletedAt: null },
      include: { vehicles: true, bonusWallet: true },
    });
    if (!c) throw new NotFoundException('Client not found');
    return c;
  }

  async create(branchId: string, dto: CreateClientDto) {
    const phone = normalizeAzPhone(dto.phone);
    if (!isValidAzPhone(phone)) throw new BadRequestException('Invalid AZ phone');

    return this.prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          branchId,
          phone,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          email: dto.email ?? null,
          birthday: dto.birthday ? new Date(dto.birthday) : null,
          notes: dto.notes ?? null,
          preferredLang: dto.preferredLang ?? 'ru',
        },
      });
      await tx.bonusWallet.create({ data: { clientId: client.id } });
      if (dto.vehicle) {
        await tx.vehicle.create({ data: { clientId: client.id, ...dto.vehicle } });
      }
      return tx.client.findUniqueOrThrow({
        where: { id: client.id },
        include: { vehicles: true, bonusWallet: true },
      });
    });
  }

  async update(branchId: string, id: string, dto: UpdateClientDto) {
    await this.findOne(branchId, id);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        phone: dto.phone ? normalizeAzPhone(dto.phone) : undefined,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
      include: { vehicles: true, bonusWallet: true },
    });
  }

  async softDelete(branchId: string, id: string) {
    await this.findOne(branchId, id);
    await this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
