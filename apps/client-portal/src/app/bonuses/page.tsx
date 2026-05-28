'use client';

import Link from 'next/link';
import { useState } from 'react';
import { publicApi } from '@/lib/api';

const BRANCH = 'MAIN';

export default function BonusesPage() {
  const [phone, setPhone] = useState('+99450');
  const [balance, setBalance] = useState<number | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const data = await publicApi.lookupClient(BRANCH, phone);
    setBalance(Number(data.client.bonusWallet?.balance ?? 0));
  }

  return (
    <main className="mx-auto max-w-lg p-8 space-y-6">
      <Link href="/" className="text-sm text-brand-600">
        ← Назад
      </Link>
      <h1 className="text-2xl font-bold">Бонусный баланс</h1>
      <form onSubmit={lookup} className="card flex gap-2">
        <input className="input flex-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit" className="btn-primary">
          Проверить
        </button>
      </form>
      {balance !== null && (
        <div className="card text-center">
          <div className="text-sm text-gray-500">Ваш баланс</div>
          <div className="text-3xl font-bold text-brand-600">{balance.toFixed(2)} AZN</div>
        </div>
      )}
    </main>
  );
}
