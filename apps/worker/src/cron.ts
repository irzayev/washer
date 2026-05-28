import type { PrismaClient } from '@washer/db';
import type { Logger } from 'pino';

/** Daily marketing / ops cron (runs in worker process) */
export async function runCronJobs(prisma: PrismaClient, logger: Logger) {
  const now = new Date();
  logger.info('Cron tick');

  // Low stock alerts → outbox
  const lowStock = await prisma.$queryRawUnsafe<{ id: string; name: string; branchId: string }[]>(
    `SELECT id, name, "branchId" FROM "InventoryItem"
     WHERE "isActive" = true AND "stockQty" <= "minStock" LIMIT 50`,
  );
  for (const item of lowStock) {
    const exists = await prisma.outboxEvent.findFirst({
      where: {
        type: 'inventory.low_stock',
        aggregateId: item.id,
        status: 'PENDING',
        createdAt: { gte: new Date(now.getTime() - 86400000) },
      },
    });
    if (!exists) {
      await prisma.outboxEvent.create({
        data: {
          aggregate: 'inventory',
          aggregateId: item.id,
          type: 'inventory.low_stock',
          payload: { itemId: item.id, name: item.name, branchId: item.branchId },
        },
      });
    }
  }

  // Inactive clients (90+ days) — enqueue reminder notifications
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
  const inactive = await prisma.client.findMany({
    where: {
      deletedAt: null,
      orders: { none: { openedAt: { gte: ninetyDaysAgo } } },
    },
    take: 20,
  });
  for (const c of inactive) {
    await prisma.notification.create({
      data: {
        recipientType: 'client',
        recipientId: c.id,
        channel: 'WHATSAPP',
        template: 'client.inactive',
        status: 'PENDING',
        payload: {
          phone: c.phone,
          text: `Salam ${c.firstName}! Sizi uzun müddət görməmişik. Xüsusi endirimlə xidmətinizə gözləyirik!`,
        },
      },
    });
  }

  // Birthday today
  const today = now.toISOString().slice(5, 10); // MM-DD
  const birthdays = await prisma.$queryRawUnsafe<{ id: string; phone: string; firstName: string }[]>(
    `SELECT id, phone, "firstName" FROM "Client"
     WHERE "deletedAt" IS NULL AND birthday IS NOT NULL
       AND to_char(birthday, 'MM-DD') = $1 LIMIT 20`,
    today,
  );
  for (const c of birthdays) {
    await prisma.notification.create({
      data: {
        recipientType: 'client',
        recipientId: c.id,
        channel: 'WHATSAPP',
        template: 'client.birthday',
        status: 'PENDING',
        payload: {
          phone: c.phone,
          text: `Təbrik edirik, ${c.firstName}! Ad gününüz mübarək olsun! Sizə xüsusi hədiyyə gözləyir.`,
        },
      },
    });
  }

  logger.info({ lowStock: lowStock.length, inactive: inactive.length, birthdays: birthdays.length }, 'Cron done');
}
