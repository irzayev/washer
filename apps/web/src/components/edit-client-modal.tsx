'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';

interface EditClientModalProps {
  open: boolean;
  client: any;
  onClose: () => void;
  onSaved: (client: any) => void;
}

export function EditClientModal({ open, client, onClose, onSaved }: EditClientModalProps) {
  const [phone, setPhone] = useState('+994');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !client) return;
    setPhone(client.phone ?? '+994');
    setFirstName(client.firstName ?? '');
    setLastName(client.lastName ?? '');
    setEmail(client.email ?? '');
    setNotes(client.notes ?? '');
    setError(null);
  }, [open, client]);

  if (!open || !client) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateClient(client.id, {
        phone,
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        notes: notes || undefined,
      });
      onSaved(updated);
      onClose();
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
          <h2 className="text-lg font-semibold">Редактировать клиента</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-zinc-800">
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
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Заметки</label>
            <textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
