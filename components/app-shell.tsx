'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRialo } from '@/lib/rialo/provider';
import { formatKelvinAsRlo } from '@/lib/rialo/scheduled-transfer';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workflows/new', label: 'New Workflow' },
  { href: '/history', label: 'History' },
  { href: '/settings', label: 'Settings' },
];

const P = {
  lightest: '#FEFCF3',
  cream: '#FAE8B4',
  sand: '#CBBD93',
  olive: '#80775C',
  bark: '#574A24',
};

function WalletButton() {
  const {
    wallet,
    connectionStatus,
    connectWallet,
    disconnectWallet,
    requestAirdrop,
    airdropStatus,
    airdropError,
  } = useRialo();

  if (!wallet.publicKey) {
    return (
      <button
        onClick={connectWallet}
        className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all hover:opacity-80"
        style={{ background: P.bark, color: P.cream }}
      >
        Connect Wallet
      </button>
    );
  }

  const short = wallet.publicKey.slice(0, 4) + '...' + wallet.publicKey.slice(-4);
  const balance = wallet.balanceKelvin !== null ? formatKelvinAsRlo(wallet.balanceKelvin) : '—';

  return (
    <div className="flex items-center gap-3" style={{ position: 'relative' }}>
      <button
        onClick={requestAirdrop}
        disabled={airdropStatus === 'pending'}
        className="px-3 py-1 rounded-lg text-xs transition-all hover:opacity-80 border disabled:opacity-50"
        style={{
          borderColor: airdropStatus === 'error' ? '#F5B7B1' : P.sand + '88',
          color: airdropStatus === 'error' ? '#C0392B' : P.olive,
        }}
        title="Request 1 RLO airdrop (DevNet only)"
      >
        {airdropStatus === 'pending' ? 'Requesting...' : airdropStatus === 'error' ? 'Airdrop failed' : 'Airdrop'}
      </button>
      {airdropStatus === 'error' && airdropError && (
        <div
          role="alert"
          className="absolute top-full left-0 mt-2 z-50 text-xs px-3 py-2 rounded-lg border shadow-sm"
          style={{ background: '#FDEDEC', borderColor: '#F5B7B1', color: '#C0392B', maxWidth: 260 }}
        >
          {airdropError}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: connectionStatus === 'connected' ? '#22c55e' : connectionStatus === 'error' ? '#ef4444' : '#eab308',
          }}
        />
        <span className="text-xs" style={{ color: P.olive }}>
          {balance} RLO
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(wallet.publicKey!);
          }}
          className="text-xs px-2 py-1 rounded-md border transition-all hover:opacity-80"
          style={{ borderColor: P.sand + '66', color: P.bark }}
          title={`Click to copy: ${wallet.publicKey}`}
        >
          {short}
        </button>
        <button
          onClick={disconnectWallet}
          className="text-xs px-1 py-1 rounded-md transition-all hover:opacity-60"
          style={{ color: P.olive }}
          title="Disconnect wallet"
        >
          x
        </button>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === '/') return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: P.lightest }}>
      {/* DevNet indicator */}
      <div
        className="text-center text-xs py-1 px-4 tracking-wide"
        style={{ background: '#1e3a5f', color: '#7db3e0' }}
      >
        RIALO DEVNET — Development-only ephemeral keys. No real funds.
      </div>

      {/* Nav */}
      <header
        className="border-b sticky top-6 z-40 backdrop-blur"
        style={{ borderColor: P.sand + '66', background: 'rgba(254,252,243,0.92)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-widest text-sm uppercase" style={{ color: P.bark }}>
            <Image src="/logo.svg" alt="" width={24} height={24} className="rounded-md" />
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
                    ? { background: P.bark + '15', color: P.bark, border: `1px solid ${P.sand}88` }
                    : { color: P.olive }
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto">
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">{children}</main>

      <footer
        className="border-t py-4 text-center text-xs"
        style={{ borderColor: P.sand + '66', color: P.olive, background: P.cream + '33' }}
      >
        TriggerDesk on Rialo DevNet — Real on-chain workflows. No simulation.
      </footer>
    </div>
  );
}
