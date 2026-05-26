'use client';

import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutProgram } from '@/types';

const GOALS = ['Μυϊκή Μάζα', 'Αδυνάτισμα', 'Δύναμη', 'Αντοχή', 'Γενική Φυσική Κατάσταση'];
const QUICK_WEEKS = [4, 6, 8, 12];

interface Props {
  onClose: () => void;
  onCreate: (program: WorkoutProgram) => void;
}

export default function CreateProgramModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setWeeks = (val: number) => setDurationWeeks(Math.min(52, Math.max(1, val)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Το όνομα είναι υποχρεωτικό'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/programs', { name, description, goal, durationWeeks });
      onCreate(data);
    } catch {
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Νέο Workout Program</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Όνομα *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="π.χ. Push Pull Legs"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Στόχος</label>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => (
                <button key={g} type="button" onClick={() => setGoal(goal === g ? '' : g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    goal === g
                      ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Διάρκεια</label>
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setWeeks(durationWeeks - 1)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Minus size={15} />
                </button>
                <input
                  type="number"
                  value={durationWeeks}
                  onChange={e => setWeeks(parseInt(e.target.value) || 1)}
                  className="w-14 text-center py-2 text-sm font-semibold text-gray-900 dark:text-white bg-transparent focus:outline-none"
                  min={1} max={52}
                />
                <button type="button" onClick={() => setWeeks(durationWeeks + 1)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={15} />
                </button>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">εβδομάδες</span>
              {/* Quick picks */}
              <div className="flex gap-1.5 ml-auto">
                {QUICK_WEEKS.map(w => (
                  <button key={w} type="button" onClick={() => setDurationWeeks(w)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      durationWeeks === w
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-brand-400'
                    }`}>
                    {w}W
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Περιγραφή</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Προαιρετική περιγραφή..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Άκυρο</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Δημιουργία...' : 'Δημιουργία'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
