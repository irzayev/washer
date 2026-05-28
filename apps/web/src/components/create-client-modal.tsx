'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateClientModal({ open, onClose, onCreated }: Props) {
  const [phone, setPhone] = useState('+994');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createClient({
        phone,
        firstName,
        lastName: lastName || undefined,
        vehicle: plate || make || model ? { plate, make, model } : undefined,
      });
      onCreated();
      onClose();
      setPhone('+994');
      setFirstName('');
      setLastName('');
      setPlate('');
      setMake('');
      setModel('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Новый клиент</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Телефон (+994...)</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="label">Имя</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Фамилия</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <p className="text-xs font-medium text-gray-500">Автомобиль (опционально)</p>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" placeholder="Госномер" value={plate} onChange={(e) => setPlate(e.target.value)} />
            <input className="input" placeholder="Марка" value={make} onChange={(e) => setMake(e.target.value)} />
            <input className="input" placeholder="Модель" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}
