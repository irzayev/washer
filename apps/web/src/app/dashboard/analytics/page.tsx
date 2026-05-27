'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export default function AnalyticsPage() {
  const [data, setData] = useState<{ day: string; revenue: number }[]>([]);
  useEffect(() => {
    api.revenue(30).then(setData).catch(() => setData([]));
  }, []);
  const max = Math.max(1, ...data.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Аналитика</h1>
        <p className="text-sm text-gray-500">Выручка по дням</p>
      </div>

      <div className="card">
        <div className="mb-4 text-sm font-medium text-gray-700 dark:text-zinc-300">Последние 30 дней</div>
        <div className="flex items-end gap-1 h-48">
          {data.map((d) => (
            <div
              key={d.day}
              className="flex-1 rounded-t bg-brand-500 hover:bg-brand-600 transition-colors relative group"
              style={{ height: `${(d.revenue / max) * 100}%`, minHeight: 2 }}
              title={`${new Date(d.day).toLocaleDateString('ru-RU')}: ${formatMoney(d.revenue)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
