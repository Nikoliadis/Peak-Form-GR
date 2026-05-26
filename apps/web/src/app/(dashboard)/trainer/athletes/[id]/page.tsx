'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Dumbbell, Mail, Calendar, CheckCircle, Target, ChevronDown, X } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutProgram } from '@/types';

interface AthleteDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  linkedSince: string;
  workoutCount: number;
  activeAssignment?: {
    id: string;
    startDate: string;
    program: { id: string; name: string; goal?: string | null; durationWeeks: number };
  } | null;
  allAssignments: {
    id: string;
    startDate: string;
    endDate?: string | null;
    isActive: boolean;
    program: { id: string; name: string; goal?: string | null };
  }[];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function AthleteDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [athlete, setAthlete] = useState<AthleteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/users/trainer/athletes/${id}`),
      api.get('/programs'),
    ]).then(([athleteRes, programsRes]) => {
      setAthlete(athleteRes.data);
      setPrograms(programsRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAssign = async () => {
    if (!selectedProgram) return;
    setAssigning(true);
    try {
      const { data } = await api.post(`/users/trainer/athletes/${id}/assign`, { programId: selectedProgram });
      setAthlete(prev => prev ? { ...prev, activeAssignment: data } : prev);
      setShowAssign(false);
      setSelectedProgram('');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!athlete?.activeAssignment || !confirm('Αφαίρεση program;')) return;
    await api.delete(`/users/trainer/athletes/${id}/assign`);
    setAthlete(prev => prev ? { ...prev, activeAssignment: null } : prev);
  };

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-2xl">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="card h-32" />
      <div className="card h-24" />
    </div>
  );

  if (!athlete) return <div className="text-gray-500">Athlete not found.</div>;

  const joinDate = new Date(athlete.linkedSince).toLocaleDateString('el-GR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/trainer/athletes')} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {athlete.firstName} {athlete.lastName}
        </h1>
      </div>

      {/* Profile Card */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {athlete.firstName[0]}{athlete.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {athlete.firstName} {athlete.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
            <Mail size={13} /> {athlete.email}
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
            <Calendar size={12} /> Μέλος από {joinDate}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{athlete.workoutCount}</p>
          <p className="text-xs text-gray-400">workouts</p>
        </div>
      </div>

      {/* Active Program */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell size={18} className="text-brand-500" />
            Ενεργό Program
          </h2>
          <button
            onClick={() => setShowAssign(true)}
            className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 font-medium"
          >
            {athlete.activeAssignment ? 'Αλλαγή' : '+ Ανάθεση'}
          </button>
        </div>

        {athlete.activeAssignment ? (
          <div className="flex items-center justify-between bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{athlete.activeAssignment.program.name}</p>
              <div className="flex items-center gap-3 mt-1">
                {athlete.activeAssignment.program.goal && (
                  <span className="text-xs text-brand-500 flex items-center gap-1">
                    <Target size={11} />{athlete.activeAssignment.program.goal}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {athlete.activeAssignment.program.durationWeeks} εβδομάδες
                </span>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle size={11} /> Ενεργό
                </span>
              </div>
            </div>
            <button onClick={handleUnassign} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Dumbbell size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Δεν υπάρχει ενεργό program</p>
            <button onClick={() => setShowAssign(true)} className="btn-primary mt-4 text-sm">
              Ανάθεση Program
            </button>
          </div>
        )}
      </div>

      {/* History */}
      {athlete.allAssignments.filter(a => !a.isActive).length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Ιστορικό Programs</h2>
          {athlete.allAssignments.filter(a => !a.isActive).map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <p className="text-sm text-gray-600 dark:text-gray-300">{a.program.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(a.startDate).toLocaleDateString('el-GR')}
                {a.endDate && ` — ${new Date(a.endDate).toLocaleDateString('el-GR')}`}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ανάθεση Program</h2>
              <button onClick={() => setShowAssign(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {programs.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">Δεν έχεις programs ακόμα.</p>
                  <button onClick={() => router.push('/trainer/programs')} className="btn-primary mt-3 text-sm">
                    Δημιούργησε Program
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {programs.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProgram(p.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                          selectedProgram === p.id
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-brand-400'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{p.durationWeeks} εβδομάδες{p.goal && ` · ${p.goal}`}</p>
                        </div>
                        {selectedProgram === p.id && <CheckCircle size={16} className="text-brand-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowAssign(false)} className="btn-secondary flex-1">Άκυρο</button>
                    <button onClick={handleAssign} disabled={!selectedProgram || assigning} className="btn-primary flex-1">
                      {assigning ? 'Ανάθεση...' : 'Ανάθεση'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
