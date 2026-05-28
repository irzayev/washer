'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, type PaymentMethod, type PricingPreview } from '@/lib/api';
import { cn, formatMoney } from '@/lib/utils';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'WAITING', label: 'Ожидание' },
  { value: 'COMPLETED', label: 'Завершён (без оплаты)' },
  { value: 'DELIVERED', label: 'Выдан' },
] as const;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [bonusUsed, setBonusUsed] = useState(0);
  const [payments, setPayments] = useState<{ method: PaymentMethod; amount: string }[]>([
    { method: 'CASH', amount: '' },
  ]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const o = await api.getOrder(id);
      setOrder(o);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadPreview = useCallback(async () => {
    if (!order || order.status === 'COMPLETED' || order.status === 'DELIVERED') return;
    try {
      const discounts =
        discountValue > 0
          ? [{ type: 'FIXED', value: discountValue, reason: discountReason || 'Скидка' }]
          : [];
      const p = await api.previewClose(id, { bonusUsed, discounts });
      setPreview(p);
    } catch {
      setPreview(null);
    }
  }, [id, order, bonusUsed, discountValue, discountReason]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(loadPreview, 300);
    return () => clearTimeout(t);
  }, [loadPreview]);

  useEffect(() => {
    if (preview && payments.length === 1 && !payments[0]!.amount) {
      setPayments([{ method: 'CASH', amount: String(preview.grandTotal) }]);
    }
  }, [preview]);

  async function setStatus(status: string) {
    setBusy(true);
    setError(null);
    try {
      await api.updateOrderStatus(id, status as any);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    if (!preview) return;
    setBusy(true);
    setError(null);
    try {
      const discounts =
        discountValue > 0
          ? [{ type: 'FIXED', value: discountValue, reason: discountReason || 'Скидка' }]
          : [];
      const payLines = payments.map((p) => ({ method: p.method, amount: Number(p.amount) }));
      const paySum = payLines.reduce((s, p) => s + p.amount, 0);
      if (Math.abs(paySum - preview.grandTotal) > 0.01) {
        throw new Error(`Сумма оплат ${paySum.toFixed(2)} ≠ итого ${preview.grandTotal.toFixed(2)}`);
      }
      await api.closeOrder(id, {
        bonusUsed,
        discounts,
        payments: payLines,
        idempotencyKey: `close-${id}-${Date.now()}`,
      });
      await load();
      alert('Заказ закрыт. Клиенту отправлено уведомление (WhatsApp).');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-gray-500">Загрузка...</p>;
  if (!order) return <p className="text-red-600">{error ?? 'Заказ не найден'}</p>;

  const canClose = !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            Заказ {order.number}
          </h1>
          <p className="text-sm text-gray-500">
            {order.client?.firstName} {order.client?.lastName ?? ''} · {order.status}
          </p>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Услуги</h2>
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {order.items?.map((item: any) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span>
                  {item.service?.name} × {item.qty}
                </span>
                <span className="font-medium">{formatMoney(item.priceSnapshot)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-3 text-sm text-gray-600">
            Авто:{' '}
            {order.vehicle
              ? `${order.vehicle.make ?? ''} ${order.vehicle.model ?? ''} ${order.vehicle.plate ?? ''}`
              : '—'}
          </div>

          {canClose && (
            <div className="space-y-2 border-t pt-4">
              <label className="label">Статус</label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(s.value)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-xs font-medium',
                      order.status === s.value
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {canClose && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900">Закрытие и оплата</h2>

              <div>
                <label className="label">
                  Бонусы (макс. {formatMoney(preview?.bonusMaxUsable ?? 0)}, баланс{' '}
                  {formatMoney(order.client?.bonusWallet?.balance ?? 0)})
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="input"
                  value={bonusUsed}
                  onChange={(e) => setBonusUsed(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Скидка (AZN)</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="label">Причина</label>
                  <input
                    className="input"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="VIP, акция..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Оплата (можно несколько способов)</label>
                {payments.map((p, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      className="input flex-1"
                      value={p.method}
                      onChange={(e) => {
                        const next = [...payments];
                        next[idx] = { ...next[idx]!, method: e.target.value as PaymentMethod };
                        setPayments(next);
                      }}
                    >
                      <option value="CASH">Наличные</option>
                      <option value="POS">POS</option>
                      <option value="AZERICARD">Azericard</option>
                      <option value="TRANSFER">Перевод</option>
                    </select>
                    <input
                      type="number"
                      className="input w-28"
                      value={p.amount}
                      onChange={(e) => {
                        const next = [...payments];
                        next[idx] = { ...next[idx]!, amount: e.target.value };
                        setPayments(next);
                      }}
                    />
                    {payments.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary px-2"
                        onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-brand-600"
                  onClick={() => setPayments([...payments, { method: 'POS', amount: '0' }])}
                >
                  + Добавить способ оплаты
                </button>
              </div>

              {preview && (
                <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-zinc-800">
                  <div className="flex justify-between">
                    <span>Подытог</span>
                    <span>{formatMoney(preview.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Скидка</span>
                    <span>-{formatMoney(preview.discountTotal)}</span>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Бонусы</span>
                    <span>-{formatMoney(preview.bonusUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>НДС</span>
                    <span>{formatMoney(preview.vatTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                    <span>Итого</span>
                    <span>{formatMoney(preview.grandTotal)}</span>
                  </div>
                  <div className="mt-1 text-xs text-emerald-600">
                    Начислится бонусов: {formatMoney(preview.bonusEarned)}
                  </div>
                </div>
              )}

              <button className="btn-primary w-full" disabled={busy || !preview} onClick={handleClose}>
                <CheckCircle className="h-4 w-4" />
                {busy ? 'Обработка...' : 'Закрыть заказ и принять оплату'}
              </button>
            </div>
          )}

          {!canClose && (
            <div className="card">
              <h2 className="font-semibold">Оплата</h2>
              <p className="mt-2 text-2xl font-bold">{formatMoney(order.grandTotal)}</p>
              <a
                href={api.receiptUrl(id)}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-brand-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  fetch(api.receiptUrl(id), {
                    headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
                  })
                    .then((r) => r.text())
                    .then((html) => {
                      const w = window.open('', '_blank');
                      w?.document.write(html);
                      w?.document.close();
                    });
                }}
              >
                Печать чека
              </a>
              {order.payments?.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm">
                  {order.payments.map((p: any) => (
                    <li key={p.id} className="flex justify-between">
                      <span>{p.method}</span>
                      <span>{formatMoney(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
