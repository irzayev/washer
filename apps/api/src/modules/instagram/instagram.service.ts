import { Injectable, Logger } from '@nestjs/common';

/** Instagram DM integration stub — wire Meta Graph API in production */
@Injectable()
export class InstagramService {
  private readonly logger = new Logger(InstagramService.name);

  async sendDm(recipientId: string, text: string) {
    this.logger.log(`[IG mock] to=${recipientId}: ${text.slice(0, 80)}`);
    return { ok: true, ref: 'mock' };
  }

  async handleWebhook(payload: unknown) {
    this.logger.debug({ payload }, 'Instagram webhook');
    return { received: true };
  }
}
