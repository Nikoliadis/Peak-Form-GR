'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Flame, Dumbbell, Calendar, TrendingUp } from 'lucide-react';
import { api } from '@/lib/api';

interface LogEntry {
  id: string;
  date: string;
  completed: boolean;
  setLogs: { reps: number; weight?: number | null }[];
  assignment: { program: { name: string } };
}

interface Stats {
  totalCompleted: number;
  streak: number;
}

export default function ProgressPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/athlete/history'),
      api.get('/athlete/stats'),
    ]).then(([histRes, statsRes]) => {
      setLogs(histRes.data);
      setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalVolume = (log: LogEntry) =>
    log.setLogs.reduce((acc, s) => acc + (s.reps * (s.weight ?? 0)), 0);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        <div className="card h-24" /><div className="card h-24" />
      </div>
      {[1,2,3].map(i => <div key={i} className="card h-20" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Πρόοδος</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Το ιστορικό των προπονήσεών σου</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={22} className="text-brand-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{stats?.totalCompleted ?? 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ολοκληρωμένα</p>
        </div>
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Flame size={22} className="text-orange-400" />
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{stats?.streak ?? 0}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Streak μέρες</p>
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Ιστορικό</h2>

        {logs.length === 0 ? (
          <div className="card text-center py-12">
            <Dumbbell size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Δεν υπάρχουν ολοκληρωμένες προπονήσεις ακόμα</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map(log => {
              const vol = totalVolume(log);
              const date = new Date(log.date).toLocaleDateString('el-GR', {
                weekday: 'short', day: 'numeric', month: 'short',
              });
              return (
                <div key={log.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {log.assignment.program.name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Calendar size={11} /> {date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.setLogs.length} sets</p>
                    {vol > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                        <TrendingUp size={11} />{vol.toLocaleString()}kg
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
