import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { SimProvider } from '@/lib/simulation/sim-store';
import AppShell from '@/components/app-shell';

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'TriggerDesk — Simulation Mode',
  description: 'Pure simulation of Rialo-style conditional execution engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} dark`}>
      <body className="font-mono bg-gray-950 text-gray-100 min-h-screen">
        <SimProvider>
          <AppShell>{children}</AppShell>
        </SimProvider>
      </body>
    </html>
  );
}
