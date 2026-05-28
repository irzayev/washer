import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, AppointmentSource } from '@washer/db';
import { generateOrderNumber, normalizeAzPhone, isValidAzPhone } from '@washer/utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAppointmentDto, PublicBookDto, UpdateAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(branchId: string, from?: string, to?: string, status?: AppointmentStatus) {
    return this.prisma.appointment.findMany({
      where: {
        branchId,
        ...(status ? { status } : {}),
        ...(from || to
          ? {
              slotStart: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { slotStart: 'asc' },
      include: { client: true, vehicle: true, order: { select: { id: true, number: true, status: true } } },
      take: 200,
    });
  }

  async findOne(branchId: string, id: string) {
    const a = await this.prisma.appointment.findFirst({
      where: { id, branchId },
      include: { client: true, vehicle: true, order: true },
    });
    if (!a) throw new NotFoundException('Appointment not found');
    return a;
  }

  create(branchId: string, dto: CreateAppointmentDto) {
    if (new Date(dto.slotEnd) <= new Date(dto.slotStart)) {
      throw new BadRequestException('slotEnd must be after slotStart');
    }
    return this.prisma.appointment.create({
      data: {
        branchId,
        clientId: dto.clientId,
        vehicleId: dto.vehicleId ?? null,
        slotStart: new Date(dto.slotStart),
        slotEnd: new Date(dto.slotEnd),
        serviceIds: dto.serviceIds ?? [],
        notes: dto.notes ?? null,
        source: dto.source ?? AppointmentSource.MANAGER,
      },
      include: { client: true, vehicle: true },
    });
  }

  async update(branchId: string, id: string, dto: UpdateAppointmentDto) {
    await this.findOne(branchId, id);
    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.slotStart ? { slotStart: new Date(dto.slotStart) } : {}),
        ...(dto.slotEnd ? { slotEnd: new Date(dto.slotEnd) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: { client: true, vehicle: true },
    });
  }

  async cancel(branchId: string, id: string) {
    return this.update(branchId, id, { status: AppointmentStatus.CANCELLED });
  }

  async convertToOrder(branchId: string, id: string, userId: string) {
    const appt = await this.findOne(branchId, id);
    if (appt.orderId) throw new BadRequestException('Already converted');
    if (!appt.serviceIds.length) throw new BadRequestException('No services on appointment');

    const services = await this.prisma.service.findMany({ where: { id: { in: appt.serviceIds } } });
    if (!services.length) throw new BadRequestException('Services not found');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          number: generateOrderNumber(),
          branchId,
          clientId: appt.clientId,
          vehicleId: appt.vehicleId,
          status: 'SCHEDULED',
          items: {
            create: services.map((s) => ({
              serviceId: s.id,
              priceSnapshot: s.basePrice,
              qty: 1,
            })),
          },
        },
      });
      await tx.appointment.update({
        where: { id },
        data: { orderId: order.id, status: AppointmentStatus.CONVERTED },
      });
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: { items: { include: { service: true } }, client: true },
      });
    });
  }

  /** Public online booking for client portal */
  async publicBook(branchCode: string, dto: PublicBookDto) {
    const branch = await this.prisma.branch.findFirst({ where: { code: branchCode, isActive: true } });
    if (!branch) throw new NotFoundException('Branch not found');
    const phone = normalizeAzPhone(dto.phone);
    if (!isValidAzPhone(phone)) throw new BadRequestException('Invalid phone');

    let client = await this.prisma.client.findFirst({ where: { branchId: branch.id, phone, deletedAt: null } });
    if (!client) {
      client = await this.prisma.client.create({
        data: {
          branchId: branch.id,
          phone,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          preferredLang: 'az',
        },
      });
      await this.prisma.bonusWallet.create({ data: { clientId: client.id } });
    }

    return this.create(branch.id, {
      clientId: client.id,
      slotStart: dto.slotStart,
      slotEnd: dto.slotEnd,
      serviceIds: dto.serviceIds,
      notes: dto.notes,
      source: AppointmentSource.WEB,
    });
  }
}
