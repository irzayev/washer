import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return this.prisma.vehicle.create({
      data: {
        clientId: dto.clientId,
        vin: dto.vin,
        plate: dto.plate,
        make: dto.make,
        model: dto.model,
        color: dto.color,
        branchId: dto.branchId,
      },
    });
  }

  listByClient(clientId: string) {
    return this.prisma.vehicle.findMany({
      where: { clientId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
