'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { ShoppingCart, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<{
    activeOrders: number;
    todayOrders: number;
    todayRevenue: number;
    clientsCount: number;
    lowStockItems: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.dashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600">Ошибка: {error}</div>;
  if (!data) return <div className="animate-pulse text-gray-500">Загрузка...</div>;

  const stats = [
    { label: 'Активных заказов', value: data.activeOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Заказов сегодня', value: data.todayOrders, icon: TrendingUp, color: 'bg-emerald-500' },
    { label: 'Выручка за день', value: formatMoney(data.todayRevenue), icon: TrendingUp, color: 'bg-violet-500' },
    { label: 'Клиентов всего', value: data.clientsCount, icon: Users, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Дашборд</h1>
        <p className="text-sm text-gray-500">Обзор работы автомойки</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color} text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{s.value}</div>
              </div>
              <div className="mt-3 text-sm font-medium text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {data.lowStockItems > 0 && (
        <div className="card border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <div className="font-medium text-amber-900 dark:text-amber-200">
                Низкий остаток на складе
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                Позиций требуют пополнения: {data.lowStockItems}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
