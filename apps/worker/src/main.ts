import 'reflect-metadata';
import { Worker, Queue, type ConnectionOptions } from 'bullmq';
import pino from 'pino';
import {
  PrismaClient,
  NotificationStatus,
  OutboxStatus,
  NotificationChannel,
} from '@washer/db';
import { loadApiEnv } from '@washer/config';
import { sendWhatsAppText } from './evolution';
import { handleOutboxEvent } from './outbox';
import { runCronJobs } from './cron';

const env = loadApiEnv();
const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
});

const connection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
};

const prisma = new PrismaClient();

const notificationsQueue = new Queue('notifications', { connection });
const outboxQueue = new Queue('outbox', { connection });

const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    const id = job.data.id as string;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.status !== NotificationStatus.PENDING) return;

    const payload = n.payload as { phone?: string; text?: string };

    if (n.channel === NotificationChannel.WHATSAPP && payload.phone && payload.text) {
      const result = await sendWhatsAppText(payload.phone, payload.text);
      if (result.ok) {
        await prisma.notification.update({
          where: { id },
          data: { status: NotificationStatus.SENT, sentAt: new Date(), attempts: { increment: 1 } },
        });
        logger.info({ id, ref: result.ref }, 'WhatsApp sent');
      } else {
        await prisma.notification.update({
          where: { id },
          data: {
            status: NotificationStatus.FAILED,
            attempts: { increment: 1 },
            lastError: result.error?.slice(0, 500) ?? 'send failed',
          },
        });
        logger.warn({ id, error: result.error }, 'WhatsApp failed');
      }
      return;
    }

    await prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT, sentAt: new Date(), attempts: { increment: 1 } },
    });
  },
  { connection, concurrency: 5 },
);

const outboxWorker = new Worker(
  'outbox',
  async (job) => {
    const id = job.data.id as string;
    const e = await prisma.outboxEvent.findUnique({ where: { id } });
    if (!e || e.status !== OutboxStatus.PENDING) return;

    try {
      await handleOutboxEvent(prisma, e.type, e.payload);
      await prisma.outboxEvent.update({
        where: { id },
        data: { status: OutboxStatus.PROCESSED, processedAt: new Date() },
      });
      logger.info({ id, type: e.type }, 'outbox processed');
    } catch (err) {
      await prisma.outboxEvent.update({
        where: { id },
        data: {
          status: OutboxStatus.FAILED,
          attempts: { increment: 1 },
          lastError: (err as Error).message.slice(0, 500),
        },
      });
      throw err;
    }
  },
  { connection, concurrency: 10 },
);

async function pollAndEnqueue() {
  const pending = await prisma.notification.findMany({
    where: { status: NotificationStatus.PENDING, sendAfter: { lte: new Date() } },
    take: 50,
  });
  for (const n of pending) {
    await notificationsQueue.add('send', { id: n.id }, { jobId: n.id, removeOnComplete: true });
  }

  const events = await prisma.outboxEvent.findMany({
    where: { status: OutboxStatus.PENDING },
    take: 50,
    orderBy: { createdAt: 'asc' },
  });
  for (const e of events) {
    await outboxQueue.add('process', { id: e.id }, { jobId: e.id, removeOnComplete: true });
  }
}

setInterval(() => {
  pollAndEnqueue().catch((e) => logger.error(e, 'poll failed'));
}, 5000);

notificationsWorker.on('failed', (_j, err) => logger.error({ err: err?.message }, 'notification job failed'));
outboxWorker.on('failed', (_j, err) => logger.error({ err: err?.message }, 'outbox job failed'));

logger.info('Worker started');

void runCronJobs(prisma, logger).catch((e) => logger.error(e, 'initial cron failed'));
setInterval(
  () => void runCronJobs(prisma, logger).catch((e) => logger.error(e, 'cron failed')),
  24 * 60 * 60 * 1000,
);

const shutdown = async () => {
  logger.info('Shutting down...');
  await notificationsWorker.close();
  await outboxWorker.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
