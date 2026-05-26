'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Dumbbell, Flame, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

interface TodaySummary {
  day: { name?: string | null; exercises: { id: string }[] } | null;
  currentWeek: number;
  assignment: { program: { name: string } } | null;
  finished?: boolean;
}

export default function AthleteDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [stats, setStats] = useState({ totalCompleted: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  const todayDate = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    Promise.all([
      api.get('/athlete/today').catch(() => ({ data: null })),
      api.get('/athlete/stats').catch(() => ({ data: { totalCompleted: 0, streak: 0 } })),
    ]).then(([todayRes, statsRes]) => {
      setToday(todayRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">{todayDate}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
          Γεια σου, {user?.firstName}! 💪
        </h1>
      </div>

      {/* Streak */}
      <div className="card bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
            <Flame size={28} className="text-orange-400" />
          </div>
          <div>
            <p className="text-3xl font-black text-gray-900 dark:text-white">
              {stats.streak} <span className="text-lg font-semibold text-orange-400">μέρες</span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Συνεχόμενες προπονήσεις</p>
          </div>
        </div>
      </div>

      {/* Today's Workout */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Σημερινό Workout</h2>
          {today?.day && (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full capitalize">
              {new Date().toLocaleDateString('el-GR', { weekday: 'long' })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        ) : !today || !today.assignment ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Dumbbell size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Δεν έχεις ανατεθεί πρόγραμμα</p>
          </div>
        ) : !today.day || today.day.exercises.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Σήμερα είναι ημέρα ανάπαυσης 😴</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{today.day.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {today.assignment.program.name} · Εβδομάδα {today.currentWeek} · {today.day.exercises.length} ασκήσεις
            </p>
            <button
              onClick={() => router.push('/athlete/workout')}
              className="btn-primary mt-4 flex items-center gap-2 text-sm"
            >
              Ξεκίνα Workout <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card cursor-pointer hover:border-brand-500/40 transition-all" onClick={() => router.push('/athlete/progress')}>
          <CheckCircle size={20} className="text-green-400 mb-3" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompleted}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ολοκληρωμένα</p>
        </div>
        <div className="card cursor-pointer hover:border-brand-500/40 transition-all" onClick={() => router.push('/athlete/workout')}>
          <TrendingUp size={20} className="text-brand-500 dark:text-brand-400 mb-3" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {today?.day?.exercises.length ?? '—'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ασκήσεις σήμερα</p>
        </div>
      </div>
    </div>
  );
}
