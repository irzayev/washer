import { Injectable, Logger } from '@nestjs/common';
import { loadApiEnv } from '@washer/config';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly env = loadApiEnv();

  async chat(prompt: string, system?: string): Promise<{ reply: string; model: string }> {
    const base = this.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
    const model = this.env.OLLAMA_MODEL ?? 'llama3.2';

    try {
      const res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            { role: 'user', content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
      const data = (await res.json()) as { message?: { content?: string } };
      return { reply: data.message?.content?.trim() ?? '', model };
    } catch (e) {
      this.logger.warn(`Ollama unavailable: ${(e as Error).message}`);
      return {
        reply: 'AI assistant временно недоступен. Попробуйте позже или обратитесь к менеджеру.',
        model: 'fallback',
      };
    }
  }

  suggestServices(clientHistory: string): Promise<{ reply: string; model: string }> {
    return this.chat(
      `История клиента:\n${clientHistory}\n\nПредложи 2-3 услуги детейлинга на русском, кратко.`,
      'Ты консультант автомойки и детейлинга в Баку.',
    );
  }
}
