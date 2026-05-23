import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PeakForm — Fitness & Coaching Platform',
  description: 'Η σύγχρονη πλατφόρμα για personal trainers και athletes.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
