'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const { user, accessToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace('/login');
    } else if (user.role === 'TRAINER') {
      router.replace('/trainer');
    } else {
      router.replace('/athlete');
    }
  }, [user, accessToken, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
