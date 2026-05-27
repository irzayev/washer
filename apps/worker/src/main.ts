import 'reflect-metadata';
import { Worker, Queue, type ConnectionOptions } from 'bullmq';
import pino from 'pino';
import { PrismaClient, NotificationStatus, OutboxStatus } from '@washer/db';
import { loadApiEnv } from '@washer/config';

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

export const QUEUES = {
  notifications: 'notifications',
  outbox: 'outbox',
  cron: 'cron',
} as const;

const notificationsQueue = new Queue(QUEUES.notifications, { connection });
const outboxQueue = new Queue(QUEUES.outbox, { connection });

const notificationsWorker = new Worker(
  QUEUES.notifications,
  async (job) => {
    const id = job.data.id as string;
    const n = await prisma.notification.findUnique({ where: { id } });
    if (!n || n.status !== NotificationStatus.PENDING) return;

    logger.info({ id, channel: n.channel, template: n.template }, 'sending notification');

    // TODO: dispatch by channel (WHATSAPP -> EvolutionService, SMS -> SMS provider, EMAIL -> Resend)
    // For MVP: mark as SENT.
    await prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SENT, sentAt: new Date(), attempts: { increment: 1 } },
    });
  },
  { connection, concurrency: 5 },
);

const outboxWorker = new Worker(
  QUEUES.outbox,
  async (job) => {
    const id = job.data.id as string;
    const e = await prisma.outboxEvent.findUnique({ where: { id } });
    if (!e || e.status !== OutboxStatus.PENDING) return;

    logger.info({ id, type: e.type }, 'processing outbox event');

    // TODO: route by event type (order.closed -> create WA notification, etc.)
    await prisma.outboxEvent.update({
      where: { id },
      data: { status: OutboxStatus.PROCESSED, processedAt: new Date() },
    });
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

notificationsWorker.on('failed', (j, err) => logger.error({ err: err?.message }, 'job failed'));
outboxWorker.on('failed', (j, err) => logger.error({ err: err?.message }, 'outbox failed'));

logger.info('Worker started');

const shutdown = async () => {
  logger.info('Shutting down...');
  await notificationsWorker.close();
  await outboxWorker.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
