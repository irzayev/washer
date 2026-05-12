import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { vehicles: true, bonusWallet: true },
    });
  }

  async get(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        orders: { take: 20, orderBy: { createdAt: 'desc' } },
        bonusWallet: true,
      },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: {
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        firstName: dto.firstName,
        lastName: dto.lastName,
        branchId: dto.branchId,
        vip: dto.vip ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.ensure(id);
    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        email: dto.email?.toLowerCase(),
      },
    });
  }

  private async ensure(id: string) {
    const c = await this.prisma.client.findUnique({ where: { id } });
    if (!c) {
      throw new NotFoundException('Client not found');
    }
  }
}
