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
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-black">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Δημιούργησε λογαριασμό</h1>
          <p className="text-gray-400 mt-1">Ξεκίνα το fitness journey σου</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Είμαι</label>
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Όνομα</label>
              <input {...register('firstName')} placeholder="Γιώργης" className="input-field" />
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Επώνυμο</label>
              <input {...register('lastName')} placeholder="Παπάς" className="input-field" />
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="you@example.com" className="input-field" />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Κωδικός</label>
            <input {...register('password')} type="password" placeholder="Τουλάχιστον 8 χαρακτήρες" className="input-field" />
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

        <p className="text-center text-gray-400 mt-6">
          Έχεις ήδη λογαριασμό;{' '}
          <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  );
}
