'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
  const router = useRouter();
  const { hydrate, isAuthenticated } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="auth-container">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🧪</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ExperimentHub
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Loading...</p>
      </div>
    </div>
  );
}
