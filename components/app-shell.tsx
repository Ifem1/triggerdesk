'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ExecutionToast from './execution-toast';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/rules/new',    label: 'New Rule' },
  { href: '/replay',       label: 'Replay' },
  { href: '/history',      label: 'History' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/settings',     label: 'Settings' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === '/') return <>{children}<ExecutionToast /></>;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#FEFCF3' }}>
      {/* Simulation banner */}
      <div
        className="text-center text-xs py-1.5 px-4 tracking-wide"
        style={{ background: '#574A24', color: '#CBBD93' }}
      >
        SIMULATION MODE — No real funds moved. No live onchain execution.
        This simulates Rialo-style conditional execution.
      </div>

      {/* Nav */}
      <header
        className="border-b sticky top-6 z-40 backdrop-blur"
        style={{ borderColor: '#CBBD9366', background: 'rgba(254,252,243,0.92)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
          <Link href="/" className="font-bold tracking-widest text-sm uppercase" style={{ color: '#574A24' }}>
            TriggerDesk
          </Link>
          <nav className="flex gap-1 ml-4">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all"
                style={
                  path.startsWith(n.href)
                    ? { background: '#574A2415', color: '#574A24', border: '1px solid #CBBD9388' }
                    : { color: '#80775C' }
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto">
            <Link
              href="/rules/new"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
              style={{ background: '#574A24', color: '#FAE8B4' }}
            >
              + New Rule
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">{children}</main>
      <ExecutionToast />

      <footer
        className="border-t py-4 text-center text-xs"
        style={{ borderColor: '#CBBD9366', color: '#80775C', background: '#FAE8B433' }}
      >
        TriggerDesk Simulation Mode — No real funds moved. No live onchain execution.
      </footer>
    </div>
  );
}
