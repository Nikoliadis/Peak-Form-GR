'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Μη έγκυρο email'),
  password: z.string().min(1, 'Υποχρεωτικό πεδίο'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'credentials' | 'roleSelect'>('credentials');
  const [pendingCredentials, setPendingCredentials] = useState<FormData | null>(null);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password);
      if (result.needsRoleSelection) {
        setPendingCredentials(data);
        setStep('roleSelect');
        return;
      }
      const user = useAuthStore.getState().user;
      router.replace(user?.role === 'TRAINER' ? '/trainer' : '/athlete');
    } catch {
      setError('root', { message: 'Λάθος email ή κωδικός' });
    }
  };

  const selectRole = async (role: 'TRAINER' | 'ATHLETE') => {
    if (!pendingCredentials) return;
    try {
      await login(pendingCredentials.email, pendingCredentials.password, role);
      router.replace(role === 'TRAINER' ? '/trainer' : '/athlete');
    } catch {
      setStep('credentials');
      setPendingCredentials(null);
    }
  };

  if (step === 'roleSelect') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
              <span className="text-white text-2xl font-black">PF</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Επέλεξε ρόλο</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Με ποιον ρόλο θέλεις να συνδεθείς;</p>
          </div>

          <div className="card space-y-4">
            <button
              onClick={() => selectRole('TRAINER')}
              disabled={isLoading}
              className={cn(
                'w-full py-5 px-6 rounded-xl border-2 font-semibold transition-all duration-200 text-left flex items-center gap-4',
                'border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-500/5 text-gray-900 dark:text-white'
              )}
            >
              <span className="text-3xl">🏋️</span>
              <div>
                <p className="font-semibold">Trainer</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">Διαχείριση athletes & προγραμμάτων</p>
              </div>
            </button>

            <button
              onClick={() => selectRole('ATHLETE')}
              disabled={isLoading}
              className={cn(
                'w-full py-5 px-6 rounded-xl border-2 font-semibold transition-all duration-200 text-left flex items-center gap-4',
                'border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-500/5 text-gray-900 dark:text-white'
              )}
            >
              <span className="text-3xl">💪</span>
              <div>
                <p className="font-semibold">Athlete</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">Παρακολούθηση workouts & προόδου</p>
              </div>
            </button>

            <button
              onClick={() => { setStep('credentials'); setPendingCredentials(null); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors pt-1"
            >
              Πίσω
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-black">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Καλώς ήρθες</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Σύνδεσε τον λογαριασμό σου</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="trainer@example.com"
              className="input-field"
              autoComplete="email"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Κωδικός</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field pr-12"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {errors.root && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              <p className="text-red-400 text-sm">{errors.root.message}</p>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Σύνδεση...' : 'Σύνδεση'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          Δεν έχεις λογαριασμό;{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Εγγραφή
          </Link>
        </p>
      </div>
    </div>
  );
}
