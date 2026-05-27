import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  listByClient(clientId: string) {
    return this.prisma.vehicle.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  }

  create(clientId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: { clientId, ...dto } });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Vehicle not found');
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
