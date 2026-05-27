import { Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, Prisma } from '@washer/db';
import { PrismaService } from '../../prisma/prisma.service';

export interface EnqueueNotification {
  channel: NotificationChannel;
  recipientType: 'client' | 'user';
  recipientId: string;
  template: string;
  payload: Record<string, unknown>;
  sendAfter?: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  enqueue(input: EnqueueNotification) {
    return this.prisma.notification.create({
      data: {
        channel: input.channel,
        recipientType: input.recipientType,
        recipientId: input.recipientId,
        template: input.template,
        payload: input.payload as Prisma.InputJsonValue,
        sendAfter: input.sendAfter ?? new Date(),
        status: NotificationStatus.PENDING,
      },
    });
  }

  pending(limit = 100) {
    return this.prisma.notification.findMany({
      where: { status: NotificationStatus.PENDING, sendAfter: { lte: new Date() } },
      orderBy: { sendAfter: 'asc' },
      take: limit,
    });
  }
}
