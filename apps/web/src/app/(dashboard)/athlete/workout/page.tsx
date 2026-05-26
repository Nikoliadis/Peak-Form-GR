'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, CheckCircle, Circle, ChevronDown, ChevronUp, Flame, Trophy, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkoutDay, WorkoutExercise, WorkoutLog, SetLog } from '@/types';

interface TodayData {
  assignment: { id: string; program: { id: string; name: string } };
  currentWeek: number;
  week: { weekNumber: number } | null;
  day: WorkoutDay | null;
  todayLog: WorkoutLog | null;
  finished?: boolean;
  program?: { name: string };
}

interface SetState {
  reps: string;
  weight: string;
  done: boolean;
  logId?: string;
}

export default function WorkoutPage() {
  const router = useRouter();
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [sets, setSets] = useState<Record<string, SetState[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    api.get('/athlete/today').then(({ data: d }) => {
      setData(d);
      if (d?.day) {
        // Init set states from target + any existing log
        const initSets: Record<string, SetState[]> = {};
        d.day.exercises.forEach((we: WorkoutExercise) => {
          if (we.exercise && !we.exercise.isCustom || we.exercise) {
            initSets[we.id] = Array.from({ length: we.sets }, (_, i) => {
              const existing = d.todayLog?.setLogs?.find(
                (sl: SetLog) => sl.exerciseId === we.exerciseId && sl.setNumber === i + 1
              );
              return {
                reps: existing ? String(existing.reps) : '',
                weight: existing?.weight != null ? String(existing.weight) : we.weight != null ? String(we.weight) : '',
                done: !!existing,
                logId: existing?.id,
              };
            });
          }
        });
        setSets(initSets);
        setExpanded(new Set(d.day.exercises.map((e: WorkoutExercise) => e.id)));
        if (d.todayLog) {
          setLog(d.todayLog);
          if (d.todayLog.completed) setCompleted(true);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

  const startLog = async () => {
    if (log || !data?.day || !data?.assignment) return;
    const { data: l } = await api.post('/athlete/logs', {
      dayId: data.day.id,
      assignmentId: data.assignment.id,
    });
    setLog(l);
    return l;
  };

  const logSet = async (weId: string, we: WorkoutExercise, setIdx: number) => {
    let currentLog = log;
    if (!currentLog) currentLog = await startLog() ?? null;
    if (!currentLog) return;

    const s = sets[weId][setIdx];
    const reps = parseInt(s.reps) || 0;
    const weight = s.weight ? parseFloat(s.weight) : null;

    await api.post(`/athlete/logs/${currentLog.id}/sets`, {
      exerciseId: we.exerciseId,
      setNumber: setIdx + 1,
      reps,
      weight,
    });

    setSets(prev => ({
      ...prev,
      [weId]: prev[weId].map((s, i) => i === setIdx ? { ...s, done: true } : s),
    }));
  };

  const toggleSet = async (weId: string, we: WorkoutExercise, setIdx: number) => {
    if (completed) return;
    const s = sets[weId][setIdx];
    if (s.done) {
      setSets(prev => ({
        ...prev,
        [weId]: prev[weId].map((s, i) => i === setIdx ? { ...s, done: false } : s),
      }));
      return;
    }
    await logSet(weId, we, setIdx);
  };

  const completeWorkout = async () => {
    if (!log && data?.day && data?.assignment) {
      const l = await startLog();
      if (!l) return;
    }
    setCompleting(true);
    try {
      await api.put(`/athlete/logs/${log!.id}/complete`, {});
      setCompleted(true);
    } finally {
      setCompleting(false);
    }
  };

  const totalSets = Object.values(sets).reduce((acc, s) => acc + s.length, 0);
  const doneSets = Object.values(sets).reduce((acc, s) => acc + s.filter(x => x.done).length, 0);
  const progress = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  const today = new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="card h-32" />
      <div className="card h-48" />
    </div>
  );

  if (!data) return (
    <NoProgram onGoPrograms={() => router.push('/athlete')} />
  );

  if (data.finished) return (
    <div className="card text-center py-16">
      <Trophy size={48} className="text-yellow-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Program Ολοκληρώθηκε!</h2>
      <p className="text-gray-500 dark:text-gray-400">Το πρόγραμμα "{data.program?.name}" έχει τελειώσει.</p>
    </div>
  );

  if (!data.day || !data.week) return (
    <RestDay weekNumber={data.currentWeek} program={data.assignment?.program?.name} />
  );

  if (data.day.isRestDay) return (
    <RestDay weekNumber={data.currentWeek} program={data.assignment?.program?.name} dayName={data.day.name ?? undefined} />
  );

  if (completed) return (
    <CompletedView
      doneSets={doneSets}
      totalSets={totalSets}
      onHistory={() => router.push('/athlete/progress')}
    />
  );

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{today}</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.day.name}</h1>
        <p className="text-sm text-brand-500 dark:text-brand-400 mt-0.5">
          {data.assignment.program.name} · Εβδομάδα {data.currentWeek}
        </p>
      </div>

      {/* Progress Bar */}
      {totalSets > 0 && (
        <div className="card py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{doneSets}/{totalSets} sets</span>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {data.day.exercises.map((we, exIdx) => {
          const exSets = sets[we.id] ?? [];
          const exDone = exSets.filter(s => s.done).length;
          const isExpanded = expanded.has(we.id);

          return (
            <div key={we.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                onClick={() => setExpanded(prev => {
                  const next = new Set(prev);
                  next.has(we.id) ? next.delete(we.id) : next.add(we.id);
                  return next;
                })}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    exDone === exSets.length && exSets.length > 0
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {exDone === exSets.length && exSets.length > 0
                      ? <CheckCircle size={18} />
                      : exIdx + 1
                    }
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{we.exercise.name}</p>
                    <p className="text-xs text-gray-400">
                      {we.sets} × {we.reps}
                      {we.weight && ` @ ${we.weight}kg`}
                      {we.restSecs && ` · ${we.restSecs}s rest`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{exDone}/{exSets.length}</span>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  <div className="px-5 py-2 grid grid-cols-12 text-xs text-gray-400 font-medium">
                    <span className="col-span-2">Set</span>
                    <span className="col-span-4">Reps</span>
                    <span className="col-span-4">Kg</span>
                    <span className="col-span-2" />
                  </div>
                  {exSets.map((s, setIdx) => (
                    <div key={setIdx} className={`px-5 py-2 grid grid-cols-12 items-center gap-2 ${s.done ? 'opacity-60' : ''}`}>
                      <span className="col-span-2 text-sm text-gray-400 font-mono">{setIdx + 1}</span>
                      <input
                        type="number"
                        value={s.reps}
                        onChange={e => setSets(prev => ({
                          ...prev,
                          [we.id]: prev[we.id].map((x, i) => i === setIdx ? { ...x, reps: e.target.value } : x),
                        }))}
                        placeholder={we.reps.includes('-') ? we.reps.split('-')[1] : we.reps}
                        className="col-span-4 text-center text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                        disabled={s.done}
                      />
                      <input
                        type="number"
                        value={s.weight}
                        onChange={e => setSets(prev => ({
                          ...prev,
                          [we.id]: prev[we.id].map((x, i) => i === setIdx ? { ...x, weight: e.target.value } : x),
                        }))}
                        placeholder="0"
                        step="0.5"
                        className="col-span-4 text-center text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                        disabled={s.done}
                      />
                      <button
                        onClick={() => toggleSet(we.id, we, setIdx)}
                        className={`col-span-2 flex justify-center transition-colors ${
                          s.done ? 'text-green-500' : 'text-gray-300 hover:text-brand-500'
                        }`}
                      >
                        {s.done ? <CheckCircle size={22} /> : <Circle size={22} />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete Button */}
      <button
        onClick={completeWorkout}
        disabled={completing || doneSets === 0}
        className="w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {completing ? 'Αποθήκευση...' : (
          <>
            <CheckCircle size={20} />
            Ολοκλήρωση Workout
            {doneSets > 0 && <span className="text-sm opacity-80">({progress}%)</span>}
          </>
        )}
      </button>
    </div>
  );
}

function NoProgram({ onGoPrograms }: { onGoPrograms: () => void }) {
  return (
    <div className="card text-center py-16">
      <Dumbbell size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Δεν έχεις ενεργό πρόγραμμα</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">Ο trainer σου δεν έχει αναθέσει πρόγραμμα ακόμα.</p>
    </div>
  );
}

function RestDay({ weekNumber, program, dayName }: { weekNumber: number; program?: string; dayName?: string }) {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Flame size={32} className="text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {dayName ?? 'Ημέρα Ανάπαυσης'}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        {program} · Εβδομάδα {weekNumber}
      </p>
      <p className="text-gray-400 text-sm mt-2">Ξεκουράσου — αύριο συνεχίζεις! 💪</p>
    </div>
  );
}

function CompletedView({ doneSets, totalSets, onHistory }: { doneSets: number; totalSets: number; onHistory: () => void }) {
  return (
    <div className="card text-center py-16 space-y-4">
      <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Ολοκληρώθηκε!</h2>
      <p className="text-gray-500 dark:text-gray-400">{doneSets} από {totalSets} sets καταγράφηκαν</p>
      <button onClick={onHistory} className="btn-primary flex items-center gap-2 mx-auto">
        Δες την Πρόοδό σου <ArrowRight size={16} />
      </button>
    </div>
  );
}
