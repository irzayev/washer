import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EvolutionService {
  private readonly log = new Logger(EvolutionService.name);

  constructor(private readonly config: ConfigService) {}

  async sendText(number: string, text: string) {
    const base = this.config.get<string>('EVOLUTION_API_URL');
    const key = this.config.get<string>('EVOLUTION_API_KEY');
    const instance = this.config.get<string>('EVOLUTION_INSTANCE_NAME');
    if (!base || !instance) {
      this.log.warn('Evolution API not configured; skipping send');
      return { skipped: true as const };
    }
    const url = `${base.replace(/\/$/, '')}/message/sendText/${instance}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(key ? { apikey: key } : {}),
      },
      body: JSON.stringify({ number, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.log.error(`Evolution send failed ${res.status}: ${body}`);
      throw new Error('Evolution send failed');
    }
    return { ok: true as const };
  }
}
