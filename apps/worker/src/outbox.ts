import {
  NotificationChannel,
  NotificationStatus,
  PrismaClient,
} from '@washer/db';

interface OrderClosedPayload {
  orderId: string;
  orderNumber?: string;
  clientId: string;
  clientPhone?: string;
  grandTotal?: string;
  currency?: string;
}

export async function handleOutboxEvent(prisma: PrismaClient, type: string, payload: unknown) {
  if (type === 'order.closed') {
    const p = payload as OrderClosedPayload;
    if (!p.clientId) return;

    const client = await prisma.client.findUnique({ where: { id: p.clientId } });
    const phone = p.clientPhone ?? client?.phone;
    if (!phone) return;

    const text = `Salam! Sifarişiniz ${p.orderNumber ?? ''} hazırdır. Məbləğ: ${p.grandTotal ?? ''} ${p.currency ?? 'AZN'}. Təşəkkür edirik!`;

    await prisma.notification.create({
      data: {
        recipientType: 'client',
        recipientId: p.clientId,
        channel: NotificationChannel.WHATSAPP,
        template: 'order.ready',
        payload: { phone, text, orderId: p.orderId },
        status: NotificationStatus.PENDING,
        sendAfter: new Date(),
      },
    });
  }
}
