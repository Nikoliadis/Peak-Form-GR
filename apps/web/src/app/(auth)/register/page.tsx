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
  firstName: z.string().min(1, 'Υποχρεωτικό'),
  lastName: z.string().min(1, 'Υποχρεωτικό'),
  email: z.string().email('Μη έγκυρο email'),
  password: z.string().min(8, 'Τουλάχιστον 8 χαρακτήρες'),
  role: z.enum(['TRAINER', 'ATHLETE']),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'TRAINER' | 'ATHLETE'>('ATHLETE');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ATHLETE' },
  });

  const handleRoleSelect = (role: 'TRAINER' | 'ATHLETE') => {
    setSelectedRole(role);
    setValue('role', role);
  };

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data);
      router.replace(data.role === 'TRAINER' ? '/trainer' : '/athlete');
    } catch {
      setError('root', { message: 'Κάτι πήγε στραβά. Δοκίμασε ξανά.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-black">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Δημιούργησε λογαριασμό</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Ξεκίνα το fitness journey σου</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Είμαι</label>
            <div className="grid grid-cols-2 gap-3">
              {(['TRAINER', 'ATHLETE'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={cn(
                    'py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 text-sm',
                    selectedRole === role
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  )}
                >
                  {role === 'TRAINER' ? '🏋️ Trainer' : '💪 Athlete'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Όνομα</label>
              <input {...register('firstName')} placeholder="Γιώργης" className="input-field" />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Επώνυμο</label>
              <input {...register('lastName')} placeholder="Παπάς" className="input-field" />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Κωδικός</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Τουλάχιστον 8 χαρακτήρες"
                className="input-field pr-12"
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
            {isLoading ? 'Δημιουργία...' : 'Δημιουργία λογαριασμού'}
          </button>
        </form>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
          Έχεις ήδη λογαριασμό;{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  );
}
