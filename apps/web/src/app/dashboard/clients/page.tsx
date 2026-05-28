'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { Search, Plus } from 'lucide-react';
import { CreateClientModal } from '@/components/create-client-modal';

export default function ClientsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.listClients(q);
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Клиенты</h1>
          <p className="text-sm text-gray-500">База клиентов и их автомобилей</p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Добавить клиента
        </button>
      </div>

      <CreateClientModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />

      <div className="card p-0">
        <div className="border-b border-gray-200 p-4 dark:border-zinc-800">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Поиск по имени, телефону, email..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3">Имя</th>
                <th className="px-4 py-3">Телефон</th>
                <th className="px-4 py-3">VIP</th>
                <th className="px-4 py-3">Авто</th>
                <th className="px-4 py-3">Бонусы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {loading && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Клиенты не найдены</td></tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">
                    <Link href={`/dashboard/clients/${c.id}`} className="text-brand-600 hover:underline">
                      {c.firstName} {c.lastName ?? ''}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">{c.phone}</td>
                  <td className="px-4 py-3">
                    {c.vipTier !== 'NONE' && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {c.vipTier}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                    {c.vehicles?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-zinc-100">
                    {formatMoney(c.bonusWallet?.balance ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
