'use client';

import { useEffect, useState } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { Exercise } from '@/types';
import { cn } from '@/lib/utils';

const MUSCLE_GROUPS = ['Όλα', 'Στήθος', 'Πλάτη', 'Ώμοι', 'Δικέφαλοι', 'Τρικέφαλοι', 'Πόδια', 'Κοιλιακοί'];

interface Props {
  onClose: () => void;
  onSelect: (exerciseId: string) => void;
  existingIds: string[];
}

export default function ExercisePicker({ onClose, onSelect, existingIds }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('Όλα');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/exercises').then(({ data }) => setExercises(data)).finally(() => setLoading(false));
  }, []);

  const filtered = exercises.filter(ex => {
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = muscle === 'Όλα' || ex.muscleGroup === muscle;
    return matchSearch && matchMuscle;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Επιλογή Άσκησης</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Αναζήτηση άσκησης..."
              className="input-field pl-9 py-2.5"
              autoFocus
            />
          </div>
        </div>

        {/* Muscle Group Filter */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-gray-100 dark:border-gray-800 shrink-0">
          {MUSCLE_GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setMuscle(g)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border',
                muscle === g
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Exercise List */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500">
              <p>Δεν βρέθηκαν ασκήσεις</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {filtered.map(ex => {
                const alreadyAdded = existingIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => !alreadyAdded && onSelect(ex.id)}
                    disabled={alreadyAdded}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                      alreadyAdded
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-brand-400'
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{ex.name}</p>
                      <p className="text-xs text-gray-400">
                        {ex.muscleGroup}{ex.equipment && ` · ${ex.equipment}`}
                        {ex.isCustom && ' · Custom'}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs text-gray-400">Ήδη στη λίστα</span>
                    ) : (
                      <Plus size={16} className="text-brand-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
