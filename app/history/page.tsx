'use client';

import { useSim } from '@/lib/simulation/sim-store';
import { formatTimestamp } from '@/lib/utils/format';
import Link from 'next/link';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

export default function HistoryPage() {
  const { receipts } = useSim();

  return (
    <div style={{ color: P.bark }} className="space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Execution History</h1>
        <p style={{ color: P.olive, fontSize: 14, marginTop: 4 }}>Simulated execution receipts — every trigger logged</p>
      </div>

      {receipts.length === 0 ? (
        <div style={{ border: `1px dashed ${P.sand}`, borderRadius: 16, padding: 56, textAlign: 'center' }}>
          <p style={{ color: P.olive, fontSize: 15 }}>No executions yet.</p>
          <p style={{ color: P.sand, fontSize: 13, marginTop: 8 }}>
            Run a replay to trigger rules and generate receipts.{' '}
            <Link href="/replay" style={{ color: P.bark, fontWeight: 600 }}>Go to Replay →</Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((r) => (
            <div key={r.id} style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: '#FFFEF8' }} className="space-y-4">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, color: P.bark, fontSize: 16 }}>{r.ruleName}</p>
                  <p style={{ fontSize: 11, color: P.sand, fontFamily: 'monospace', marginTop: 2 }}>{r.id}</p>
                </div>
                <span style={{ background: '#EAFAF1', color: '#1E8449', border: '1px solid #A9DFBF', fontSize: 11, padding: '3px 10px', borderRadius: 8, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {r.status}
                </span>
              </div>

              <p style={{ color: P.bark, fontSize: 14 }}>{r.reason}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }} className="md:grid-cols-4">
                {[
                  { label: 'Observed',  value: String(r.observedValue), color: '#2E86C1' },
                  { label: 'Threshold', value: String(r.threshold),     color: '#B7950B' },
                  { label: 'Predicate', value: r.predicate.replace(/_/g,' '), color: '#CA6F1E' },
                  { label: 'Action',    value: r.action.replace(/_/g,' '),    color: '#6C3483' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: P.lightest, border: `1px solid ${P.sand}55`, borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 10, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
                    <p style={{ color, fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{value}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 11, color: P.sand }}>{formatTimestamp(r.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
