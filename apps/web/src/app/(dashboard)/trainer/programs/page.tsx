'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, Plus, Calendar, Target, ChevronRight, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutProgram } from '@/types';
import CreateProgramModal from './CreateProgramModal';

export default function ProgramsPage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/programs');
      setPrograms(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Διαγραφή program;')) return;
    await api.delete(`/programs/${id}`);
    setPrograms(p => p.filter(pr => pr.id !== id));
  };

  const totalExercises = (p: WorkoutProgram) =>
    p.weeks.reduce((acc, w) => acc + w.days.reduce((a, d) => a + (d.exercises?.length ?? 0), 0), 0);

  const totalDays = (p: WorkoutProgram) =>
    p.weeks.reduce((acc, w) => acc + w.days.length, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Προγράμματα</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Δημιούργησε και διαχειρίσου workout programs</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Νέο Program
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : programs.length === 0 ? (
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
              <Dumbbell size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Δεν έχεις programs ακόμα</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Δημιούργησε το πρώτο workout program για τους athletes σου</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-6 flex items-center gap-2">
              <Plus size={18} />
              Δημιούργησε Program
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programs.map(program => (
            <div
              key={program.id}
              onClick={() => router.push(`/trainer/programs/${program.id}`)}
              className="card cursor-pointer hover:border-brand-500/50 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
                  <Dumbbell size={20} className="text-brand-500" />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(program.id, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{program.name}</h3>
              {program.goal && (
                <p className="text-sm text-brand-500 dark:text-brand-400 mb-3 flex items-center gap-1">
                  <Target size={13} />
                  {program.goal}
                </p>
              )}
              {program.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{program.description}</p>
              )}

              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {program.durationWeeks} εβδομάδες
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell size={12} />
                  {totalDays(program)} μέρες
                </span>
                <span>{totalExercises(program)} ασκήσεις</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateProgramModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => {
            setShowModal(false);
            router.push(`/trainer/programs/${p.id}`);
          }}
        />
      )}
    </div>
  );
}
