'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';

export default function NewOrderPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clientId, setClientId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const client = clients.find((c) => c.id === clientId);

  useEffect(() => {
    Promise.all([api.listClients('', 1, 100), api.listServices()]).then(([c, s]) => {
      setClients(c.items);
      setServices(s);
    });
  }, []);

  function toggleService(id: string) {
    setSelectedServices((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const items = Object.entries(selectedServices).map(([serviceId, qty]) => ({ serviceId, qty }));
    if (!clientId || items.length === 0) {
      setError('Выберите клиента и хотя бы одну услугу');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await api.createOrder({
        clientId,
        vehicleId: vehicleId || undefined,
        notes: notes || undefined,
        items,
      });
      router.push(`/dashboard/orders/${order.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold">Новый заказ</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <form onSubmit={submit} className="card space-y-4">
        <div>
          <label className="label">Клиент</label>
          <select className="input" value={clientId} onChange={(e) => { setClientId(e.target.value); setVehicleId(''); }} required>
            <option value="">Выберите клиента</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName ?? ''} — {c.phone}
              </option>
            ))}
          </select>
        </div>

        {client?.vehicles?.length > 0 && (
          <div>
            <label className="label">Автомобиль</label>
            <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Не выбран</option>
              {client.vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {[v.make, v.model, v.plate].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label">Услуги</label>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
            {services.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={!!selectedServices[s.id]}
                  onChange={() => toggleService(s.id)}
                />
                <span className="flex-1">{s.name}</span>
                <span className="font-medium">{Number(s.basePrice).toFixed(2)} AZN</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Примечание</label>
          <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Создание...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  );
}
