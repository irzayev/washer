'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/api';

const BRANCH = 'MAIN';

export default function BookPage() {
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({
    phone: '+99450',
    firstName: '',
    slotStart: '',
    slotEnd: '',
    serviceId: '',
    notes: '',
  });
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi.listServices().then(setServices).catch(() => []);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await publicApi.bookAppointment(BRANCH, {
        phone: form.phone,
        firstName: form.firstName,
        slotStart: new Date(form.slotStart).toISOString(),
        slotEnd: new Date(form.slotEnd).toISOString(),
        serviceIds: form.serviceId ? [form.serviceId] : [],
        notes: form.notes,
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? 'Ошибка');
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <div className="card text-center">
          <h1 className="text-xl font-semibold text-emerald-700">Запись создана!</h1>
          <p className="mt-2 text-sm text-gray-600">Мы свяжемся с вами для подтверждения.</p>
          <Link href="/" className="mt-4 inline-block text-brand-600">
            На главную
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8 space-y-6">
      <Link href="/" className="text-sm text-brand-600">
        ← Назад
      </Link>
      <h1 className="text-2xl font-bold">Онлайн-запись</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <form onSubmit={submit} className="card space-y-4">
        <input className="input" placeholder="Имя" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input className="input" placeholder="Телефон +994..." required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="input" value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
          <option value="">Услуга (опционально)</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.basePrice} AZN
            </option>
          ))}
        </select>
        <input className="input" type="datetime-local" required value={form.slotStart} onChange={(e) => setForm({ ...form, slotStart: e.target.value })} />
        <input className="input" type="datetime-local" required value={form.slotEnd} onChange={(e) => setForm({ ...form, slotEnd: e.target.value })} />
        <textarea className="input" placeholder="Комментарий" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit" className="btn-primary w-full">
          Записаться
        </button>
      </form>
    </main>
  );
}
