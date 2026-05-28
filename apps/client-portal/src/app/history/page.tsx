'use client';

import Link from 'next/link';
import { useState } from 'react';
import { publicApi } from '@/lib/api';

const BRANCH = 'MAIN';

export default function HistoryPage() {
  const [phone, setPhone] = useState('+99450');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setData(await publicApi.lookupClient(BRANCH, phone));
    } catch {
      setError('Клиент не найден');
      setData(null);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-8 space-y-6">
      <Link href="/" className="text-sm text-brand-600">
        ← Назад
      </Link>
      <h1 className="text-2xl font-bold">История посещений</h1>
      <form onSubmit={lookup} className="card flex gap-2">
        <input className="input flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" />
        <button type="submit" className="btn-primary">
          Найти
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {data && (
        <div className="space-y-4">
          <div className="card">
            <div className="font-medium">
              {data.client.firstName} {data.client.lastName ?? ''}
            </div>
            <div className="text-sm text-gray-500">{data.client.phone}</div>
          </div>
          <ul className="card divide-y text-sm">
            {data.orders?.map((o: any) => (
              <li key={o.id} className="flex justify-between py-2 px-4">
                <span>{o.number}</span>
                <span>{Number(o.grandTotal).toFixed(2)} AZN</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
