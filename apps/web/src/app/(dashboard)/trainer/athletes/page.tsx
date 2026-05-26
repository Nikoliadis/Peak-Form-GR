'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, Search, Dumbbell, X, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { AthleteProfile } from '@/types';

export default function AthletesPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<AthleteProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/users/trainer/athletes');
      setAthletes(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const { data } = await api.post('/users/trainer/invite', { athleteEmail: inviteEmail });
      setInviteMsg({ type: 'success', text: `Ο ${data.firstName} ${data.lastName} προστέθηκε!` });
      setInviteEmail('');
      load();
    } catch (err: any) {
      setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Κάτι πήγε στραβά' });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Αφαίρεση του ${name};`)) return;
    await api.delete(`/users/trainer/athletes/${id}`);
    setAthletes(prev => prev.filter(a => a.id !== id));
  };

  const filtered = athletes.filter(a =>
    `${a.firstName} ${a.lastName} ${a.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Athletes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {athletes.length} {athletes.length === 1 ? 'athlete' : 'athletes'} συνολικά
          </p>
        </div>
        <button onClick={() => { setShowInvite(true); setInviteMsg(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Προσθήκη
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{athletes.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ενεργοί Athletes</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {athletes.filter(a => a.activeAssignment).length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Με Ενεργό Program</p>
        </div>
        <div className="card hidden md:block">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {athletes.reduce((acc, a) => acc + a.workoutCount, 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Συνολικά Workouts</p>
        </div>
      </div>

      {/* Search */}
      {athletes.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Αναζήτηση athlete..."
            className="input-field pl-10"
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && athletes.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <Users size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Δεν έχεις athletes ακόμα</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Πρόσθεσε τον πρώτο athlete σου</p>
            <button onClick={() => setShowInvite(true)} className="btn-primary mt-6 flex items-center gap-2">
              <Plus size={18} /> Προσθήκη Athlete
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Κανένα αποτέλεσμα για "{search}"</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(athlete => (
            <div
              key={athlete.id}
              onClick={() => router.push(`/trainer/athletes/${athlete.id}`)}
              className="card cursor-pointer hover:border-brand-500/40 transition-all group flex items-center gap-4"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {athlete.firstName[0]}{athlete.lastName[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {athlete.firstName} {athlete.lastName}
                  </p>
                  {athlete.activeAssignment && (
                    <span className="hidden sm:flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} /> Ενεργό
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{athlete.email}</p>
                {athlete.activeAssignment ? (
                  <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5 flex items-center gap-1">
                    <Dumbbell size={11} />
                    {athlete.activeAssignment.program.name}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Χωρίς program</p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{athlete.workoutCount}</p>
                <p className="text-xs text-gray-400">workouts</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); handleRemove(athlete.id, `${athlete.firstName} ${athlete.lastName}`); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Προσθήκη Athlete</h2>
              <button onClick={() => setShowInvite(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ο athlete πρέπει να έχει ήδη λογαριασμό στο PeakForm ως <strong>Athlete</strong>.
              </p>
              <form onSubmit={handleInvite} className="space-y-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email του athlete..."
                  className="input-field"
                  required
                  autoFocus
                />
                {inviteMsg && (
                  <p className={`text-sm ${inviteMsg.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {inviteMsg.text}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Άκυρο</button>
                  <button type="submit" disabled={inviteLoading} className="btn-primary flex-1">
                    {inviteLoading ? 'Αναζήτηση...' : 'Προσθήκη'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
