'use client';

import { useSim } from '@/lib/simulation/sim-store';
import { ReplayFile } from '@/lib/types/feed';
import RuleStateBadge from '@/components/rules/rule-state-badge';

import ethDrop          from '@/data/replays/eth-drop-demo.json';
import invoiceDue       from '@/data/replays/invoice-due-demo.json';
import collateralWarning from '@/data/replays/collateral-warning-demo.json';
import escrowRelease    from '@/data/replays/escrow-release-demo.json';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };
const REPLAYS: ReplayFile[] = [ethDrop as ReplayFile, invoiceDue as ReplayFile, collateralWarning as ReplayFile, escrowRelease as ReplayFile];

export default function ReplayPage() {
  const { rules, feedState, replayFile, replayIndex, replayRunning, replaySpeed,
          loadReplay, startReplay, pauseReplay, resetReplay, stepReplay, setReplaySpeed } = useSim();

  const events  = replayFile?.events ?? [];
  const progress = events.length > 0 ? (replayIndex / events.length) * 100 : 0;
  const done     = replayIndex >= events.length && events.length > 0;

  const btn = (label: string, onClick: () => void, primary = false, disabled = false) => (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        background: primary ? P.bark : '#FFFEF8', color: primary ? P.cream : P.bark,
        border: `1px solid ${primary ? P.bark : P.sand}`, opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ color: P.bark }} className="space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Replay Engine</h1>
        <p style={{ color: P.olive, fontSize: 14, marginTop: 4 }}>Play deterministic demo feeds and watch rules trigger</p>
      </div>

      {/* Replay selector */}
      <div>
        <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Select Demo</p>
        <div className="grid md:grid-cols-2 gap-3">
          {REPLAYS.map((r) => (
            <button
              key={r.name} onClick={() => loadReplay(r)}
              style={{
                textAlign: 'left', padding: 16, borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                border: `1px solid ${replayFile?.name === r.name ? P.bark : P.sand}`,
                background: replayFile?.name === r.name ? P.cream + '55' : '#FFFEF8',
              }}
            >
              <p style={{ fontWeight: 600, color: P.bark, fontSize: 14 }}>{r.name}</p>
              <p style={{ color: P.olive, fontSize: 12, marginTop: 4 }}>{r.description}</p>
              <p style={{ color: P.sand, fontSize: 11, marginTop: 6 }}>{r.events.length} events · Feed: {r.feedKey}</p>
            </button>
          ))}
        </div>
      </div>

      {replayFile && (
        <>
          {/* Controls */}
          <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: '#FFFEF8' }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p style={{ fontWeight: 600, color: P.bark }}>{replayFile.name}</p>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,5].map((s) => (
                  <button key={s} onClick={() => setReplaySpeed(s)} style={{
                    padding: '4px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                    border: `1px solid ${replaySpeed === s ? P.bark : P.sand}`,
                    background: replaySpeed === s ? P.cream : '#FFFEF8',
                    color: replaySpeed === s ? P.bark : P.olive,
                  }}>{s}x</button>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ background: P.sand + '44', borderRadius: 99, height: 6 }}>
              <div style={{ width: `${progress}%`, height: 6, background: P.bark, borderRadius: 99, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 12, color: P.olive, textAlign: 'right' }}>{replayIndex} / {events.length} events</p>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {!replayRunning && !done && btn('▶ Play', startReplay, true)}
              {replayRunning  && btn('⏸ Pause', pauseReplay, true)}
              {!replayRunning && btn('⏭ Step', stepReplay, false, done)}
              {btn('↺ Reset', resetReplay)}
              {done && <span style={{ color: '#1E8449', fontSize: 13, fontWeight: 600 }}>✓ Replay complete</span>}
            </div>
          </div>

          {/* Feed timeline */}
          <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: '#FFFEF8' }}>
            <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Feed Timeline</p>
            <div style={{ maxHeight: 260, overflowY: 'auto' }} className="space-y-1">
              {events.map((ev, i) => {
                const played  = i < replayIndex;
                const current = i === replayIndex - 1;
                return (
                  <div key={i} style={{
                    display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderRadius: 8, fontFamily: 'monospace', fontSize: 13,
                    background: current ? P.cream + '66' : 'transparent',
                    border: current ? `1px solid ${P.sand}` : '1px solid transparent',
                    opacity: played && !current ? 0.45 : !played ? 0.25 : 1,
                  }}>
                    <span style={{ color: P.sand, width: 40, textAlign: 'right', flexShrink: 0 }}>t={ev.t}s</span>
                    <span style={{ color: '#2E86C1', width: 140, flexShrink: 0 }}>{ev.feed}</span>
                    <span style={{ color: P.bark, fontWeight: current ? 700 : 400 }}>{String(ev.value)}</span>
                    {current && <span style={{ color: P.olive, fontSize: 11, marginLeft: 'auto' }}>← current</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current feed values */}
          {Object.keys(feedState).length > 0 && (
            <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: P.cream + '44' }}>
              <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Current Feed Values</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(feedState).map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontSize: 11, color: P.olive }}>{k}</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: P.bark, marginTop: 2 }}>{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Rules watch panel */}
      <div>
        <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Rules Being Watched</p>
        {rules.length === 0 ? (
          <p style={{ color: P.olive, fontSize: 14 }}>No rules defined.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${P.sand}88`, borderRadius: 12, padding: '12px 16px', background: '#FFFEF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: P.bark, fontWeight: 600, fontSize: 14 }}>{r.name}</span>
                  <span style={{ color: P.olive, fontSize: 12, marginLeft: 10, fontFamily: 'monospace' }}>
                    {r.inputKey} {r.predicate.replace(/_/g,' ')} {String(r.threshold)}
                  </span>
                </div>
                <RuleStateBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
