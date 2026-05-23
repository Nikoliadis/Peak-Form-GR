'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Μη έγκυρο email'),
  password: z.string().min(1, 'Υποχρεωτικό πεδίο'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      const user = useAuthStore.getState().user;
      router.replace(user?.role === 'TRAINER' ? '/trainer' : '/athlete');
    } catch {
      setError('root', { message: 'Λάθος email ή κωδικός' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-black">PF</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Καλώς ήρθες</h1>
          <p className="text-gray-400 mt-1">Σύνδεσε τον λογαριασμό σου</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
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
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Κωδικός</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="input-field"
              autoComplete="current-password"
            />
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

        <p className="text-center text-gray-400 mt-6">
          Δεν έχεις λογαριασμό;{' '}
          <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Εγγραφή
          </Link>
        </p>
      </div>
    </div>
  );
}
