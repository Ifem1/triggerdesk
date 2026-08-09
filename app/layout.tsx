import type { Metadata } from 'next';
import './globals.css';
import { RialoProvider } from '@/lib/rialo/provider';
import AppShell from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'TriggerDesk — Rialo DevNet',
  description: 'No-code automated workflow builder on Rialo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-mono bg-gray-950 text-gray-100 min-h-screen">
        <RialoProvider>
          <AppShell>{children}</AppShell>
        </RialoProvider>
      </body>
    </html>
  );
}
