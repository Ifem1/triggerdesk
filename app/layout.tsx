import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';
import { RialoProvider } from '@/lib/rialo/provider';
import AppShell from '@/components/app-shell';

const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'TriggerDesk — Rialo DevNet',
  description: 'No-code automated workflow builder on Rialo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} dark`}>
      <body className="font-mono bg-gray-950 text-gray-100 min-h-screen">
        <RialoProvider>
          <AppShell>{children}</AppShell>
        </RialoProvider>
      </body>
    </html>
  );
}
