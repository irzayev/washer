'use client';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/inventory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">Склад</h1>
        <p className="text-sm text-gray-500">Химия, расходники, инструменты</p>
      </div>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Наименование</th>
              <th className="px-4 py-3 text-right">Остаток</th>
              <th className="px-4 py-3 text-right">Минимум</th>
              <th className="px-4 py-3 text-right">Себестоимость</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
            {items.map((i) => {
              const low = Number(i.stockQty) <= Number(i.minStock);
              return (
                <tr key={i.id} className={low ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-zinc-300">{i.sku ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{i.name}</td>
                  <td className="px-4 py-3 text-right">{i.stockQty} {i.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{i.minStock} {i.unit}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(i.costAvg)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
