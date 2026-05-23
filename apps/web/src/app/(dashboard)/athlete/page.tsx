'use client';

import { useAuthStore } from '@/store/auth';
import { Dumbbell, Flame, CheckCircle, TrendingUp } from 'lucide-react';

export default function AthleteDashboard() {
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-gray-400 text-sm capitalize">{today}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
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
            <p className="text-3xl font-black text-white">0 <span className="text-lg font-semibold text-orange-400">μέρες</span></p>
            <p className="text-gray-400 text-sm">Συνεχόμενες προπονήσεις</p>
          </div>
        </div>
      </div>

      {/* Today's Workout */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Σημερινό Workout</h2>
          <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">Δευτέρα</span>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <Dumbbell size={28} className="text-gray-500" />
          </div>
          <p className="text-gray-400 font-medium">Δεν έχεις ανατεθεί πρόγραμμα</p>
          <p className="text-gray-500 text-sm mt-1">Ο trainer σου δεν έχει ανατείλει workout ακόμα</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <CheckCircle size={20} className="text-green-400 mb-3" />
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-sm text-gray-400">Ολοκληρωμένα</p>
        </div>
        <div className="card">
          <TrendingUp size={20} className="text-brand-400 mb-3" />
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-sm text-gray-400">Βελτίωση</p>
        </div>
      </div>
    </div>
  );
}
