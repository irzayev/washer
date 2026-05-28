const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const publicApi = {
  bookAppointment: (branchCode: string, body: Record<string, unknown>) =>
    fetch(`${BASE}/api/v1/appointments/public/book/${branchCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t);
      }
      return r.json();
    }),
  lookupClient: (branchCode: string, phone: string) =>
    fetch(
      `${BASE}/api/v1/clients/public/lookup?branchCode=${encodeURIComponent(branchCode)}&phone=${encodeURIComponent(phone)}`,
    ).then(async (r) => {
      if (!r.ok) throw new Error('Клиент не найден');
      return r.json();
    }),
  listServices: () => fetch(`${BASE}/api/v1/catalog/services`).then((r) => r.json()),
};
