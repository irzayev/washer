'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [createItem, setCreateItem] = useState({ sku: '', name: '', unit: 'pcs', minStock: '0' });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState({ sku: '', name: '', unit: '', minStock: '0' });
  const [receive, setReceive] = useState({ itemId: '', qty: '100', unitCost: '0.02', note: '' });
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = () => api.listInventory().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.receiveStock({
        itemId: receive.itemId,
        qty: Number(receive.qty),
        unitCost: Number(receive.unitCost),
        note: receive.note || undefined,
      });
      setReceive({ itemId: '', qty: '100', unitCost: '0.02', note: '' });
      await load();
      setNotice({ type: 'success', text: 'Приход успешно проведен.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось выполнить приход.' });
    }
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createInventoryItem({
        sku: createItem.sku || undefined,
        name: createItem.name.trim(),
        unit: createItem.unit.trim() || 'pcs',
        minStock: Number(createItem.minStock),
      });
      setCreateItem({ sku: '', name: '', unit: 'pcs', minStock: '0' });
      await load();
      setNotice({ type: 'success', text: 'Позиция успешно добавлена.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось добавить позицию.' });
    }
  }

  function startEdit(item: any) {
    setEditingItemId(item.id);
    setEditItem({
      sku: item.sku ?? '',
      name: item.name ?? '',
      unit: item.unit ?? '',
      minStock: String(item.minStock ?? 0),
    });
  }

  async function handleSaveEdit(itemId: string) {
    try {
      await api.updateInventoryItem(itemId, {
        sku: editItem.sku || undefined,
        name: editItem.name.trim(),
        unit: editItem.unit.trim() || 'pcs',
        minStock: Number(editItem.minStock),
      });
      setEditingItemId(null);
      setEditItem({ sku: '', name: '', unit: '', minStock: '0' });
      await load();
      setNotice({ type: 'success', text: 'Позиция успешно обновлена.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Не удалось сохранить изменения.' });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Склад</h1>
        <p className="text-sm text-gray-500">Остатки, приход, добавление и редактирование позиций</p>
      </div>
      {notice && (
        <div
          className={`card border ${
            notice.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">{notice.text}</p>
            <button
              type="button"
              className="rounded-lg border border-current px-2 py-1 text-xs"
              onClick={() => setNotice(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCreateItem} className="card grid gap-3 md:grid-cols-5">
        <input
          className="input"
          placeholder="SKU"
          value={createItem.sku}
          onChange={(e) => setCreateItem({ ...createItem, sku: e.target.value })}
        />
        <input
          className="input"
          required
          placeholder="Наименование"
          value={createItem.name}
          onChange={(e) => setCreateItem({ ...createItem, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Ед. изм. (напр. pcs)"
          value={createItem.unit}
          onChange={(e) => setCreateItem({ ...createItem, unit: e.target.value })}
        />
        <input
          className="input"
          type="number"
          min="0"
          step="0.001"
          placeholder="Мин. остаток"
          value={createItem.minStock}
          onChange={(e) => setCreateItem({ ...createItem, minStock: e.target.value })}
        />
        <button type="submit" className="btn-primary">Добавить позицию</button>
      </form>

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
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className={`border-t ${Number(i.stockQty) <= Number(i.minStock) ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3">
                  {editingItemId === i.id ? (
                    <input
                      className="input h-9"
                      placeholder="SKU"
                      value={editItem.sku}
                      onChange={(e) => setEditItem({ ...editItem, sku: e.target.value })}
                    />
                  ) : (
                    i.sku
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingItemId === i.id ? (
                    <input
                      className="input h-9"
                      placeholder="Наименование"
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    />
                  ) : (
                    i.name
                  )}
                </td>
                <td className="px-4 py-3 text-right">{i.stockQty} {i.unit}</td>
                <td className="px-4 py-3 text-right">
                  {editingItemId === i.id ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input h-9 text-right"
                        placeholder="Мин."
                        type="number"
                        min="0"
                        step="0.001"
                        value={editItem.minStock}
                        onChange={(e) => setEditItem({ ...editItem, minStock: e.target.value })}
                      />
                      <input
                        className="input h-9"
                        placeholder="Ед."
                        value={editItem.unit}
                        onChange={(e) => setEditItem({ ...editItem, unit: e.target.value })}
                      />
                    </div>
                  ) : (
                    i.minStock
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingItemId === i.id ? (
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn-primary" onClick={() => handleSaveEdit(i.id)}>
                        Сохранить
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                        onClick={() => setEditingItemId(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm"
                      onClick={() => startEdit(i)}
                    >
                      Редактировать
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
