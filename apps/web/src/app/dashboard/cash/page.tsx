'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export default function CashPage() {
  const [shift, setShift] = useState<any>(null);
  const [amount, setAmount] = useState('0');
  const [report, setReport] = useState<any>(null);

  const load = () => api.cashCurrent().then(setShift).catch(() => setShift(null));
  useEffect(() => {
    load();
  }, []);

  async function openShift() {
    await api.cashOpen(Number(amount));
    await load();
  }

  async function closeShift() {
    const closed = await api.cashClose(Number(amount));
    setReport(await api.cashReport(closed.id));
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Касса</h1>
        <p className="text-sm text-gray-500">Смены и Z-отчёт</p>
      </div>

      <div className="card max-w-md space-y-4">
        {shift ? (
          <>
            <p className="text-sm">
              Смена открыта с {new Date(shift.openedAt).toLocaleString('ru-RU')}
              <br />
              В кассе на старте: {formatMoney(shift.openingCash)}
            </p>
            <input className="input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Сумма в кассе" />
            <button className="btn-primary w-full" onClick={closeShift}>
              Закрыть смену
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Смена закрыта</p>
            <input className="input" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Начальная сумма" />
            <button className="btn-primary w-full" onClick={openShift}>
              Открыть смену
            </button>
          </>
        )}
      </div>

      {report && (
        <div className="card">
          <h2 className="font-medium mb-2">Отчёт смены</h2>
          <p className="text-sm">Ожидалось: {formatMoney(report.shift.expectedCash)}</p>
          <p className="text-sm">Факт: {formatMoney(report.shift.closingCash)}</p>
          <p className="text-sm">Разница: {formatMoney(report.shift.diff)}</p>
          <ul className="mt-2 text-sm">
            {report.totals?.map((t: any) => (
              <li key={t.method}>
                {t.method}: {formatMoney(t._sum?.amount ?? 0)} ({t._count?._all ?? 0})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
