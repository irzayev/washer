export async function sendWhatsAppText(
  to: string,
  text: string,
): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const baseUrl = process.env.EVOLUTION_API_URL ?? '';
  const apiKey = process.env.EVOLUTION_API_KEY ?? '';
  const instance = process.env.EVOLUTION_INSTANCE_NAME ?? 'washer';

  if (!baseUrl || !apiKey || apiKey === 'change-me') {
    console.log(`[WA mock] ${to}: ${text}`);
    return { ok: true, ref: 'mock' };
  }

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: apiKey },
      body: JSON.stringify({ number: to.replace(/\D/g, ''), text }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => ({}))) as { key?: { id?: string } };
    return { ok: true, ref: json.key?.id };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
