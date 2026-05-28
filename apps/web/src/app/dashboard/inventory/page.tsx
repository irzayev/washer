'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [receive, setReceive] = useState({ itemId: '', qty: '100', unitCost: '0.02', note: '' });

  const load = () => api.listInventory().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    await api.receiveStock({
      itemId: receive.itemId,
      qty: Number(receive.qty),
      unitCost: Number(receive.unitCost),
      note: receive.note || undefined,
    });
    setReceive({ itemId: '', qty: '100', unitCost: '0.02', note: '' });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Склад</h1>
        <p className="text-sm text-gray-500">Остатки и приход товара</p>
      </div>

      <form onSubmit={handleReceive} className="card grid gap-3 md:grid-cols-4">
        <select className="input" required value={receive.itemId} onChange={(e) => setReceive({ ...receive, itemId: e.target.value })}>
          <option value="">Позиция</option>
          {items.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
        <input className="input" type="number" placeholder="Кол-во" value={receive.qty} onChange={(e) => setReceive({ ...receive, qty: e.target.value })} />
        <input className="input" type="number" step="0.0001" placeholder="Цена" value={receive.unitCost} onChange={(e) => setReceive({ ...receive, unitCost: e.target.value })} />
        <button type="submit" className="btn-primary">Приход</button>
      </form>

      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Наименование</th>
              <th className="px-4 py-3 text-right">Остаток</th>
              <th className="px-4 py-3 text-right">Мин.</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className={`border-t ${Number(i.stockQty) <= Number(i.minStock) ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3">{i.sku}</td>
                <td className="px-4 py-3">{i.name}</td>
                <td className="px-4 py-3 text-right">{i.stockQty} {i.unit}</td>
                <td className="px-4 py-3 text-right">{i.minStock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
