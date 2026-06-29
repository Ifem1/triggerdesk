'use client';

import { useState } from 'react';
import { useSim } from '@/lib/simulation/sim-store';
import { useRouter } from 'next/navigation';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

export default function SettingsPage() {
  const { resetAll, replaySpeed, setReplaySpeed } = useSim();
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  function handleReset() {
    if (!confirmed) { setConfirmed(true); return; }
    resetAll();
    setDone(true);
    setConfirmed(false);
    setTimeout(() => { setDone(false); router.push('/dashboard'); }, 1500);
  }

  const card = (children: React.ReactNode) => (
    <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 24, background: '#FFFEF8' }}>{children}</div>
  );

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', color: P.bark }} className="space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Settings</h1>
        <p style={{ color: P.olive, fontSize: 14, marginTop: 4 }}>Demo configuration and reset options</p>
      </div>

      {/* Replay speed */}
      {card(
        <div className="space-y-4">
          <h2 style={{ fontSize: 13, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Replay Speed</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {[1,2,5].map((s) => (
              <button key={s} onClick={() => setReplaySpeed(s)} style={{
                padding: '8px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                border: `1px solid ${replaySpeed === s ? P.bark : P.sand}`,
                background: replaySpeed === s ? P.cream : '#FFFEF8',
                color: replaySpeed === s ? P.bark : P.olive,
              }}>{s}x</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: P.sand }}>Controls how fast the replay runner advances through events.</p>
        </div>
      )}

      {/* Info */}
      {card(
        <div className="space-y-4">
          <h2 style={{ fontSize: 13, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulation Info</h2>
          {[['Mode','Pure Simulation'],['Storage','Browser localStorage'],['Network','None'],['Real funds','None'],['Onchain execution','None']].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: P.olive }}>{k}</span>
              <span style={{ color: P.bark, fontFamily: 'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reset */}
      <div style={{ border: `1px solid #F5B7B1`, borderRadius: 16, padding: 24, background: '#FDFAFA' }}>
        <h2 style={{ fontSize: 13, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Reset Demo Data</h2>
        <p style={{ fontSize: 14, color: P.olive, marginBottom: 20 }}>
          Resets all rules, receipts, and simulated state back to seed demo data. All progress will be lost.
        </p>
        {done ? (
          <p style={{ color: '#1E8449', fontSize: 14, fontWeight: 600 }}>Reset complete. Redirecting...</p>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleReset} style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              background: confirmed ? '#C0392B' : '#FFFEF8',
              color: confirmed ? '#fff' : '#C0392B',
              border: `1px solid ${confirmed ? '#C0392B' : '#F5B7B1'}`,
            }}>
              {confirmed ? 'Click again to confirm' : 'Reset All Demo Data'}
            </button>
            {confirmed && (
              <button onClick={() => setConfirmed(false)} style={{ fontSize: 12, color: P.olive, background: 'none', border: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
