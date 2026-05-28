'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export default function AnalyticsPage() {
  const [data, setData] = useState<{ day: string; revenue: number }[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [topEmployees, setTopEmployees] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [segments, setSegments] = useState<any>(null);

  useEffect(() => {
    api.revenue(30).then(setData).catch(() => setData([]));
    api.topServices().then(setTopServices).catch(() => []);
    api.topEmployees().then(setTopEmployees).catch(() => []);
    api.boxLoad().then(setBoxes).catch(() => []);
    api.clientSegments().then(setSegments).catch(() => null);
  }, []);

  const max = Math.max(1, ...data.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <p className="text-sm text-gray-500">Выручка, услуги, сотрудники, загрузка боксов</p>
      </div>

      {segments && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Всего клиентов', value: segments.total },
            { label: 'VIP', value: segments.vip },
            { label: 'Неактивные 90д', value: segments.inactive },
            { label: 'Частые', value: segments.frequent },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="text-sm text-gray-500">{s.label}</div>
              <div className="text-2xl font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="mb-4 text-sm font-medium">Выручка за 30 дней</div>
        <div className="flex items-end gap-1 h-48">
          {data.map((d) => (
            <div
              key={d.day}
              className="flex-1 rounded-t bg-brand-500 hover:bg-brand-600 transition-colors"
              style={{ height: `${(d.revenue / max) * 100}%`, minHeight: 2 }}
              title={`${new Date(d.day).toLocaleDateString('ru-RU')}: ${formatMoney(d.revenue)}`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-medium">Топ услуг</h2>
          <ul className="space-y-2 text-sm">
            {topServices.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span>{formatMoney(s.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 className="mb-3 font-medium">Топ сотрудников</h2>
          <ul className="space-y-2 text-sm">
            {topEmployees.map((e) => (
              <li key={e.name} className="flex justify-between">
                <span>{e.name}</span>
                <span>{formatMoney(e.revenue)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-medium">Загрузка боксов</h2>
        <div className="flex flex-wrap gap-4">
          {boxes.map((b) => (
            <div key={b.id} className="rounded-lg border px-4 py-3 text-sm">
              <div className="font-medium">{b.name}</div>
              <div className="text-gray-500">{b.activeOrders} активных заказов</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
