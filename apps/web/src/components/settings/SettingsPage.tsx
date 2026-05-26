'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { User, Shield, RefreshCw, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Role = 'TRAINER' | 'ATHLETE';

const roleLabel = (r: Role) => r === 'TRAINER' ? 'Trainer' : 'Athlete';
const roleEmoji = (r: Role) => r === 'TRAINER' ? '🏋️' : '💪';

export default function SettingsPage() {
  const router = useRouter();
  const { user, switchRole } = useAuthStore();

  // enable flow
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [enabling, setEnabling] = useState(false);

  // remove flow
  const [removeTarget, setRemoveTarget] = useState<Role | null>(null);
  const [removing, setRemoving] = useState(false);

  const isDual = !!user?.dualRole;
  const activeRole = user?.role as Role | undefined;
  const otherRole: Role = activeRole === 'TRAINER' ? 'ATHLETE' : 'TRAINER';

  const handleEnableDualRole = async () => {
    setEnabling(true);
    try {
      await api.post('/auth/enable-dual-role', {});
      useAuthStore.setState(state => ({
        user: state.user ? { ...state.user, dualRole: true } : null,
      }));
      setShowEnableConfirm(false);
    } finally {
      setEnabling(false);
    }
  };

  const handleSwitchNow = async () => {
    await switchRole(otherRole);
    router.replace(otherRole === 'TRAINER' ? '/trainer' : '/athlete');
  };

  const handleRemoveRole = async (removeRole: Role) => {
    setRemoving(true);
    try {
      const { data } = await api.post('/auth/remove-role', { removeRole });
      // Store new tokens + user
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      useAuthStore.setState({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
      setRemoveTarget(null);
      // Redirect if we removed the active role
      if (removeRole === activeRole) {
        router.replace(data.user.role === 'TRAINER' ? '/trainer' : '/athlete');
      }
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ρυθμίσεις</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Διαχείριση λογαριασμού</p>
      </div>

      {/* Profile card */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-lg">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5 font-medium">
            {activeRole === 'TRAINER' ? 'Trainer' : 'Athlete'}
            {isDual && ' · Dual Role'}
          </p>
        </div>
      </div>

      {/* Roles section */}
      <div className="card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={18} className="text-brand-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Ρόλοι</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Διαχείριση των ρόλων του λογαριασμού σου</p>
          </div>
        </div>

        {/* Active roles list */}
        <div className="space-y-2">
          {(isDual ? (['TRAINER', 'ATHLETE'] as Role[]) : [activeRole as Role]).map(role => (
            <div
              key={role}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-xl border',
                role === activeRole
                  ? 'border-brand-500/30 bg-brand-500/5'
                  : 'border-gray-200 dark:border-gray-700'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{roleEmoji(role)}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{roleLabel(role)}</p>
                  {role === activeRole && (
                    <p className="text-xs text-brand-400">Ενεργός τώρα</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDual && role !== activeRole && (
                  <button
                    onClick={handleSwitchNow}
                    className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={13} /> Μετάβαση
                  </button>
                )}
                {isDual && (
                  <button
                    onClick={() => setRemoveTarget(role)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                    title={`Αφαίρεση ρόλου ${roleLabel(role)}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Remove confirm */}
        {removeTarget && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">
                  Αφαίρεση ρόλου {roleLabel(removeTarget)};
                </p>
                <p className="text-xs text-red-400/70 mt-1">
                  {removeTarget === activeRole
                    ? `Θα αποσυνδεθείς από τον ρόλο ${roleLabel(removeTarget)} και θα μεταβείς αυτόματα σε ${roleLabel(otherRole)}.`
                    : `Ο ρόλος ${roleLabel(removeTarget)} θα αφαιρεθεί από τον λογαριασμό σου.`
                  }
                  {' '}Αυτή η ενέργεια δεν αναιρείται εύκολα.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRemoveRole(removeTarget)}
                disabled={removing}
                className="text-sm bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {removing ? 'Αφαίρεση...' : `Αφαίρεση ${roleLabel(removeTarget)}`}
              </button>
              <button
                onClick={() => setRemoveTarget(null)}
                className="btn-secondary text-sm py-2 px-4"
              >
                Άκυρο
              </button>
            </div>
          </div>
        )}

        {/* Add role — shown only when not dual */}
        {!isDual && !showEnableConfirm && (
          <button
            onClick={() => setShowEnableConfirm(true)}
            className="w-full flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-400 hover:border-brand-500 hover:text-brand-500 dark:hover:border-brand-500 dark:hover:text-brand-400 transition-all"
          >
            <User size={15} />
            Προσθήκη ρόλου {roleLabel(otherRole)}
          </button>
        )}

        {!isDual && showEnableConfirm && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-amber-400">
              Προσθήκη ρόλου {roleLabel(otherRole)};
            </p>
            <p className="text-xs text-amber-400/70">
              Θα μπορείς να εναλλάσσεις ρόλους ελεύθερα από το sidebar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnableDualRole}
                disabled={enabling}
                className="btn-primary text-sm py-2 px-4"
              >
                {enabling ? 'Ενεργοποίηση...' : 'Ναι, πρόσθεσε'}
              </button>
              <button
                onClick={() => setShowEnableConfirm(false)}
                className="btn-secondary text-sm py-2 px-4"
              >
                Άκυρο
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
