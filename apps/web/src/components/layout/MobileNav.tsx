'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, Dumbbell, BarChart2, CheckSquare } from 'lucide-react';

const trainerLinks = [
  { href: '/trainer', label: 'Home', icon: LayoutDashboard },
  { href: '/trainer/athletes', label: 'Athletes', icon: Users },
  { href: '/trainer/programs', label: 'Programs', icon: Dumbbell },
  { href: '/trainer/analytics', label: 'Stats', icon: BarChart2 },
];

const athleteLinks = [
  { href: '/athlete', label: 'Home', icon: LayoutDashboard },
  { href: '/athlete/workout', label: 'Workout', icon: Dumbbell },
  { href: '/athlete/checkin', label: 'Check-in', icon: CheckSquare },
  { href: '/athlete/progress', label: 'Progress', icon: BarChart2 },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const links = user?.role === 'TRAINER' ? trainerLinks : athleteLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 pb-safe z-50">
      <div className="flex items-center justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all duration-200',
                active ? 'text-brand-400' : 'text-gray-500'
              )}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
