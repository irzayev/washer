'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

type Tab = 'services' | 'users' | 'payroll' | 'refunds';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('services');
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [svcForm, setSvcForm] = useState({ categoryId: '', name: '', basePrice: '25', durationMin: '30' });
  const [userForm, setUserForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'MANAGER' });
  const [period, setPeriod] = useState({ from: '', to: '' });

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => []);
    api.listServices().then(setServices).catch(() => []);
    api.listUsers().then(setUsers).catch(() => []);
    api.listSalaryRuns().then(setRuns).catch(() => []);
    api.listRefunds().then(setRefunds).catch(() => []);
  }, [tab]);

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    await api.createService({
      categoryId: svcForm.categoryId,
      name: svcForm.name,
      basePrice: Number(svcForm.basePrice),
      durationMin: Number(svcForm.durationMin),
    });
    setServices(await api.listServices());
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    await api.createUser(userForm);
    setUsers(await api.listUsers());
  }

  async function runPayroll(e: React.FormEvent) {
    e.preventDefault();
    await api.createSalaryRun(period.from, period.to);
    setRuns(await api.listSalaryRuns());
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'services', label: 'Услуги' },
    { id: 'users', label: 'Пользователи' },
    { id: 'payroll', label: 'Зарплаты' },
    { id: 'refunds', label: 'Возвраты' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-gray-500">Услуги, сотрудники, зарплаты, возвраты</p>
      </div>

      <div className="flex gap-2 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'services' && (
        <div className="space-y-4">
          <form onSubmit={addService} className="card grid gap-3 md:grid-cols-4">
            <select className="input" required value={svcForm.categoryId} onChange={(e) => setSvcForm({ ...svcForm, categoryId: e.target.value })}>
              <option value="">Категория</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input className="input" placeholder="Название" required value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })} />
            <input className="input" type="number" placeholder="Цена" value={svcForm.basePrice} onChange={(e) => setSvcForm({ ...svcForm, basePrice: e.target.value })} />
            <button type="submit" className="btn-primary">Добавить</button>
          </form>
          <div className="card p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2 text-left">Услуга</th><th className="px-4 py-2 text-right">Цена</th></tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(s.basePrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-4">
          <form onSubmit={addUser} className="card grid gap-3 md:grid-cols-3">
            <input className="input" placeholder="Email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <input className="input" placeholder="Пароль" type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            <input className="input" placeholder="Имя" required value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} />
            <input className="input" placeholder="Фамилия" value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} />
            <select className="input" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="MANAGER">MANAGER</option>
              <option value="WORKER">WORKER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button type="submit" className="btn-primary">Создать</button>
          </form>
          <ul className="card divide-y text-sm">
            {users.map((u) => (
              <li key={u.id} className="flex justify-between py-2 px-4">
                <span>{u.firstName} {u.lastName} · {u.email}</span>
                <span className="text-gray-500">{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="space-y-4">
          <form onSubmit={runPayroll} className="card flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-gray-500">С</label>
              <input className="input" type="date" required value={period.from} onChange={(e) => setPeriod({ ...period, from: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">По</label>
              <input className="input" type="date" required value={period.to} onChange={(e) => setPeriod({ ...period, to: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary">Рассчитать зарплату</button>
          </form>
          {runs.map((r) => (
            <div key={r.id} className="card text-sm">
              <div className="font-medium mb-2">
                {r.periodFrom?.slice(0, 10)} — {r.periodTo?.slice(0, 10)} ({r.status})
              </div>
              {r.items?.map((i: any) => (
                <div key={i.id} className="flex justify-between py-1 border-t">
                  <span>Сотрудник {i.employeeId.slice(0, 8)}…</span>
                  <span>{formatMoney(i.total)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === 'refunds' && (
        <div className="card text-sm">
          {refunds.length === 0 ? (
            <p className="text-gray-500 p-4">Нет возвратов</p>
          ) : (
            <ul className="divide-y">
              {refunds.map((r) => (
                <li key={r.id} className="flex justify-between px-4 py-2">
                  <span>{r.payment?.order?.number} — {r.reason}</span>
                  <span>{formatMoney(r.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
