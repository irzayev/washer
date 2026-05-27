import { Injectable, Logger } from '@nestjs/common';

export interface WaSendTextInput {
  to: string;
  text: string;
}

/**
 * Thin adapter for Evolution API.
 * Real HTTP calls are made by the worker process; here we expose typed methods
 * that build the request payload and (in MVP) directly call the API.
 */
@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseUrl = process.env.EVOLUTION_API_URL ?? '';
  private readonly apiKey = process.env.EVOLUTION_API_KEY ?? '';
  private readonly instance = process.env.EVOLUTION_INSTANCE_NAME ?? 'washer';

  async sendText(input: WaSendTextInput): Promise<{ ok: boolean; ref?: string; error?: string }> {
    if (!this.baseUrl || !this.apiKey) {
      this.logger.warn(`[WA mock] -> ${input.to}: ${input.text}`);
      return { ok: true, ref: 'mock' };
    }
    try {
      const res = await fetch(`${this.baseUrl}/message/sendText/${this.instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: this.apiKey },
        body: JSON.stringify({ number: input.to.replace('+', ''), text: input.text }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }
      const json = (await res.json().catch(() => ({}))) as { key?: { id?: string } };
      return { ok: true, ref: json.key?.id };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
