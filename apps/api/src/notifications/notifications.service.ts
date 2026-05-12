import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private readonly connection: IORedis;
  readonly queue: Queue;
  readonly pdfQueue: Queue;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    this.connection = new IORedis(url, { maxRetriesPerRequest: null });
    this.queue = new Queue('notifications', { connection: this.connection });
    this.pdfQueue = new Queue('pdf', { connection: this.connection });
  }

  async enqueueWhatsapp(
    to: string,
    template: string,
    payload: Record<string, unknown>,
  ) {
    await this.queue.add(
      'whatsapp',
      { to, template, payload },
      { removeOnComplete: 1000, removeOnFail: 5000 },
    );
  }

  async enqueuePdf(orderId: string) {
    await this.pdfQueue.add(
      'render',
      { orderId },
      { removeOnComplete: 1000, removeOnFail: 5000 },
    );
  }

  async onModuleDestroy() {
    await this.pdfQueue.close();
    await this.queue.close();
    await this.connection.quit();
  }
}
