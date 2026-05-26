'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, Dumbbell, BarChart2,
  Calendar, LogOut, Settings, CheckSquare, RefreshCw,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const trainerLinks = [
  { href: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/trainer/athletes', label: 'Athletes', icon: Users },
  { href: '/trainer/programs', label: 'Προγράμματα', icon: Dumbbell },
  { href: '/trainer/calendar', label: 'Ημερολόγιο', icon: Calendar },
  { href: '/trainer/analytics', label: 'Στατιστικά', icon: BarChart2 },
];

const athleteLinks = [
  { href: '/athlete', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/athlete/workout', label: 'Σημερινό Workout', icon: Dumbbell },
  { href: '/athlete/checkin', label: 'Check-in', icon: CheckSquare },
  { href: '/athlete/progress', label: 'Πρόοδος', icon: BarChart2 },
  { href: '/athlete/calendar', label: 'Ημερολόγιο', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole } = useAuthStore();

  const links = user?.role === 'TRAINER' ? trainerLinks : athleteLinks;

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-sm font-black">PF</span>
        </div>
        <span className="text-gray-900 dark:text-white font-bold text-lg">PeakForm</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 pt-4 border-t border-gray-200 dark:border-gray-800">
        <ThemeToggle />

        {user?.dualRole && (
          <button
            onClick={async () => {
              const targetRole = user.role === 'TRAINER' ? 'ATHLETE' : 'TRAINER';
              await switchRole(targetRole);
              router.replace(targetRole === 'TRAINER' ? '/trainer' : '/athlete');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-500 hover:text-brand-600 hover:bg-brand-500/10 dark:text-brand-400 dark:hover:text-brand-300 dark:hover:bg-brand-500/10 transition-all duration-200"
          >
            <RefreshCw size={18} />
            {user.role === 'TRAINER' ? 'Μετάβαση σε Athlete' : 'Μετάβαση σε Trainer'}
          </button>
        )}

        <Link
          href={user?.role === 'TRAINER' ? '/trainer/settings' : '/athlete/settings'}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-all duration-200"
        >
          <Settings size={18} />
          Ρυθμίσεις
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.role === 'TRAINER' ? 'Trainer' : 'Athlete'}
              {user?.dualRole && <span className="ml-1 text-brand-400">· Dual</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={18} />
          Αποσύνδεση
        </button>
      </div>
    </aside>
  );
}
