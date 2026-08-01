'use client';

import { useRialo } from '@/lib/rialo/provider';
import { DEVNET_RPC_URL, SCHEDULED_TRANSFER_PROGRAM_ID } from '@/lib/rialo/constants';
import { clearSessionKeypair } from '@/lib/rialo/keypair';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const P = { lightest: '#FEFCF3', cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 24, background: '#FFFEF8', ...style }}>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { wallet, connectionStatus, disconnectWallet, blockHeight } = useRialo();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  function handleClearSession() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    clearSessionKeypair();
    disconnectWallet();
    setDone(true);
    setConfirmed(false);
    setTimeout(() => {
      setDone(false);
      router.push('/dashboard');
    }, 1500);
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', color: P.bark }} className="space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Settings</h1>
        <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
          DevNet configuration and session management
        </p>
      </div>

      {/* Connection info */}
      <Card>
        <div className="space-y-4">
          <h2
            style={{
              fontSize: 13,
              color: P.olive,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Network
          </h2>
          {[
            ['Chain', 'Rialo DevNet'],
            ['RPC Endpoint', DEVNET_RPC_URL],
            ['Status', connectionStatus === 'connected' ? 'Connected' : connectionStatus],
            ['Block Height', blockHeight?.toString() ?? '—'],
            ['Program ID', SCHEDULED_TRANSFER_PROGRAM_ID],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ fontSize: 14 }}>
              <span style={{ color: P.olive }}>{k}</span>
              <span
                style={{
                  color: P.bark,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  textAlign: 'right',
                  maxWidth: '60%',
                  wordBreak: 'break-all',
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Wallet */}
      <Card>
        <div className="space-y-4">
          <h2
            style={{
              fontSize: 13,
              color: P.olive,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Wallet
          </h2>
          {wallet.publicKey ? (
            <>
              {[
                ['Public Key', wallet.publicKey],
                ['Storage', 'sessionStorage (ephemeral)'],
                ['Cleared on', 'Tab close'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between" style={{ fontSize: 14 }}>
                  <span style={{ color: P.olive }}>{k}</span>
                  <span
                    style={{
                      color: P.bark,
                      fontFamily: 'monospace',
                      fontSize: 12,
                      textAlign: 'right',
                      maxWidth: '60%',
                      wordBreak: 'break-all',
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: P.olive, fontSize: 14 }}>No wallet connected.</p>
          )}
        </div>
      </Card>

      {/* Security info */}
      <Card>
        <div className="space-y-4">
          <h2
            style={{
              fontSize: 13,
              color: P.olive,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Security
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: P.olive }}>
            <li className="flex gap-2">
              <span style={{ color: '#1E8449' }}>&#10003;</span>
              Ephemeral keypairs only — never persisted to disk
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#1E8449' }}>&#10003;</span>
              Session-scoped storage — cleared when you close the tab
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#1E8449' }}>&#10003;</span>
              DevNet only — no real funds at risk
            </li>
            <li className="flex gap-2">
              <span style={{ color: '#1E8449' }}>&#10003;</span>
              No external services — all transactions go directly to Rialo RPC
            </li>
          </ul>
        </div>
      </Card>

      {/* Clear session */}
      <div
        style={{
          border: '1px solid #F5B7B1',
          borderRadius: 16,
          padding: 24,
          background: '#FDFAFA',
        }}
      >
        <h2
          style={{
            fontSize: 13,
            color: '#C0392B',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
        >
          Clear Session
        </h2>
        <p style={{ fontSize: 14, color: P.olive, marginBottom: 20 }}>
          Removes the ephemeral keypair from this browser session. You will need to generate a new
          wallet to create workflows.
        </p>
        {done ? (
          <p style={{ color: '#1E8449', fontSize: 14, fontWeight: 600 }}>
            Session cleared. Redirecting...
          </p>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={handleClearSession}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: confirmed ? '#C0392B' : '#FFFEF8',
                color: confirmed ? '#fff' : '#C0392B',
                border: `1px solid ${confirmed ? '#C0392B' : '#F5B7B1'}`,
              }}
            >
              {confirmed ? 'Click again to confirm' : 'Clear Session Keypair'}
            </button>
            {confirmed && (
              <button
                onClick={() => setConfirmed(false)}
                style={{
                  fontSize: 12,
                  color: P.olive,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
