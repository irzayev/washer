'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getOrdersSocket } from '@/lib/socket';
import { formatMoney, cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  NEW: { label: 'Новый', cls: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: 'Запланирован', cls: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'В работе', cls: 'bg-amber-100 text-amber-700' },
  WAITING: { label: 'Ожидание', cls: 'bg-orange-100 text-orange-700' },
  COMPLETED: { label: 'Завершён', cls: 'bg-emerald-100 text-emerald-700' },
  DELIVERED: { label: 'Выдан', cls: 'bg-emerald-200 text-emerald-800' },
  CANCELLED: { label: 'Отменён', cls: 'bg-red-100 text-red-700' },
};

export default function OrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.listOrders().then((r) => setItems(r.items)).finally(() => setLoading(false));

  useEffect(() => {
    load();
    const user = JSON.parse(localStorage.getItem('user') ?? '{}');
    const sock = user.branchId ? getOrdersSocket(user.branchId) : null;
    sock?.on('order.updated', load);
    sock?.on('order.created', load);
    return () => {
      sock?.off('order.updated', load);
      sock?.off('order.created', load);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Заказы</h1>
          <p className="text-sm text-gray-500">Все рабочие заказы автомойки</p>
        </div>
        <Link href="/dashboard/orders/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Новый заказ
        </Link>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Клиент</th>
              <th className="px-4 py-3">Авто</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3 text-right">Сумма</th>
              <th className="px-4 py-3">Открыт</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Заказов нет</td></tr>
            )}
            {items.map((o) => {
              const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-700' };
              return (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="font-mono text-xs text-brand-600 hover:underline"
                    >
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-zinc-100">
                    {o.client?.firstName} {o.client?.lastName ?? ''}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-zinc-400">
                    {o.vehicle ? `${o.vehicle.make ?? ''} ${o.vehicle.model ?? ''} ${o.vehicle.plate ?? ''}`.trim() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', st.cls)}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-zinc-100">
                    {formatMoney(o.grandTotal || o.subtotal)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(o.openedAt).toLocaleString('ru-RU')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
