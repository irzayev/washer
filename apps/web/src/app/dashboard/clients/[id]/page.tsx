'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { EditClientModal } from '@/components/edit-client-modal';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [bonus, setBonus] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    Promise.all([api.getClient(id), api.clientHistory(id), api.clientBonus(id).catch(() => null)]).then(
      ([c, h, b]) => {
        setClient(c);
        setHistory(h);
        setBonus(b);
      },
    );
  }, [id]);

  if (!client) return <p className="text-gray-500">Загрузка...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <Link href="/dashboard/clients" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">
            {client.firstName} {client.lastName ?? ''}
          </h1>
          <p className="text-sm text-gray-500">{client.phone}</p>
        </div>
        </div>
        <button className="btn-secondary" onClick={() => setEditOpen(true)}>
          Редактировать
        </button>
      </div>

      <EditClientModal
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSaved={(updatedClient) => setClient(updatedClient)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-sm text-gray-500">VIP</div>
          <div className="text-lg font-semibold">{client.vipTier}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Бонусы</div>
          <div className="text-lg font-semibold">{formatMoney(bonus?.balance ?? 0)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500">Автомобили</div>
          <div className="text-lg font-semibold">{client.vehicles?.length ?? 0}</div>
        </div>
      </div>

      {client.vehicles?.length > 0 && (
        <div className="card">
          <h2 className="mb-3 font-medium">Автомобили</h2>
          <ul className="space-y-2 text-sm">
            {client.vehicles.map((v: any) => (
              <li key={v.id}>
                {v.plate ?? '—'} · {v.make} {v.model}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-medium">История заказов</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">Нет заказов</p>
        ) : (
          <ul className="divide-y text-sm">
            {history.map((o) => (
              <li key={o.id} className="flex justify-between py-2">
                <Link href={`/dashboard/orders/${o.id}`} className="text-brand-600 hover:underline">
                  {o.number}
                </Link>
                <span>{formatMoney(o.grandTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
