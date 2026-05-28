'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function AppointmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: '', slotStart: '', slotEnd: '', notes: '' });
  const [busy, setBusy] = useState(false);

  const load = () => api.listAppointments().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
    api.listClients('', 1, 100).then((r) => setClients(r.items));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createAppointment({
        ...form,
        slotStart: new Date(form.slotStart).toISOString(),
        slotEnd: new Date(form.slotEnd).toISOString(),
      });
      setForm({ clientId: '', slotStart: '', slotEnd: '', notes: '' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Записи</h1>
        <p className="text-sm text-gray-500">Календарь и онлайн-бронирование</p>
      </div>

      <form onSubmit={create} className="card grid gap-3 md:grid-cols-2">
        <select className="input" required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
          <option value="">Клиент</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.phone}
            </option>
          ))}
        </select>
        <input className="input" type="datetime-local" required value={form.slotStart} onChange={(e) => setForm({ ...form, slotStart: e.target.value })} />
        <input className="input" type="datetime-local" required value={form.slotEnd} onChange={(e) => setForm({ ...form, slotEnd: e.target.value })} />
        <input className="input md:col-span-2" placeholder="Заметки" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" className="btn-primary md:col-span-2" disabled={busy}>
          Создать запись
        </button>
      </form>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Слот</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">
                  {a.client?.firstName} {a.client?.phone}
                </td>
                <td className="px-4 py-3">{new Date(a.slotStart).toLocaleString('ru-RU')}</td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3 space-x-2">
                  {a.status !== 'CANCELLED' && !a.orderId && (
                    <>
                      <button className="text-brand-600 text-xs" onClick={() => api.convertAppointment(a.id).then(load)}>
                        → Заказ
                      </button>
                      <button className="text-red-600 text-xs" onClick={() => api.cancelAppointment(a.id).then(load)}>
                        Отмена
                      </button>
                    </>
                  )}
                  {a.order && (
                    <Link href={`/dashboard/orders/${a.order.id}`} className="text-brand-600 text-xs">
                      {a.order.number}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
