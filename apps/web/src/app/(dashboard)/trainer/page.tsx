'use client';

import { useAuthStore } from '@/store/auth';
import { Users, Dumbbell, TrendingUp, Activity } from 'lucide-react';

const stats = [
  { label: 'Ενεργοί Athletes', value: '0', icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { label: 'Ενεργά Programs', value: '0', icon: Dumbbell, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Workouts αυτή την εβδομάδα', value: '0', icon: Activity, color: 'text-green-400', bg: 'bg-green-500/10' },
  { label: 'Μέση Συμμόρφωση', value: '—', icon: TrendingUp, color: 'text-orange-400', bg: 'bg-orange-500/10' },
];

export default function TrainerDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Καλώς ήρθες, {user?.firstName}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Εδώ είναι η επισκόπηση των athletes σου.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`inline-flex p-2.5 rounded-xl ${bg} mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Athletes */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Athletes</h2>
          <a href="/trainer/athletes" className="text-brand-500 dark:text-brand-400 text-sm hover:text-brand-600 dark:hover:text-brand-300">
            Δες όλους →
          </a>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Users size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Δεν έχεις athletes ακόμα</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Πρόσθεσε τον πρώτο athlete σου για να ξεκινήσεις</p>
          <a href="/trainer/athletes" className="btn-primary mt-4 inline-block">
            Πρόσθεσε Athlete
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Πρόσφατη Δραστηριότητα</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Activity size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Καμία δραστηριότητα ακόμα</p>
        </div>
      </div>
    </div>
  );
}
