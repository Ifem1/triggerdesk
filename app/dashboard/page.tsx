'use client';

import { useSim } from '@/lib/simulation/sim-store';
import RuleCard from '@/components/rules/rule-card';
import Link from 'next/link';
import { formatTimestamp } from '@/lib/utils/format';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFEF8', border: `1px solid ${P.sand}88`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { rules, receipts, appState, feedState } = useSim();

  const activeRules   = rules.filter((r) => !['EXECUTED','EXPIRED','CANCELLED','FAILED','DRAFT'].includes(r.status));
  const executedRules = rules.filter((r) => r.status === 'EXECUTED');
  const recentReceipts = receipts.slice(0, 3);

  return (
    <div style={{ color: P.bark }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: P.bark, fontSize: 26, fontWeight: 700 }}>Command Centre</h1>
          <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>TriggerDesk Execution Engine — Simulation Mode</p>
        </div>
        <Link href="/rules/new" style={{ background: P.bark, color: P.cream, padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          + New Rule
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Rules', value: rules.length,         color: P.bark },
          { label: 'Active',      value: activeRules.length,   color: '#2E86C1' },
          { label: 'Executed',    value: executedRules.length, color: '#1E8449' },
          { label: 'Receipts',    value: receipts.length,      color: '#6C3483' },
        ].map((s) => (
          <Card key={s.label}>
            <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
            <p style={{ fontSize: 36, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Active Rules */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Rules</p>
            <Link href="/rules/new" style={{ fontSize: 12, color: P.bark }}>+ Add</Link>
          </div>
          {activeRules.length === 0 ? (
            <div style={{ border: `1px dashed ${P.sand}`, borderRadius: 14, padding: 32, textAlign: 'center', color: P.olive, fontSize: 14 }}>
              No active rules.{' '}
              <Link href="/rules/new" style={{ color: P.bark, fontWeight: 600 }}>Create one →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRules.map((r) => <RuleCard key={r.id} rule={r} />)}
            </div>
          )}
        </div>

        {/* Simulated State */}
        <div className="space-y-4">
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Simulated State</p>

          <Card>
            <p style={{ fontSize: 11, color: P.sand, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Portfolio</p>
            <div className="flex justify-between" style={{ marginBottom: 8 }}>
              <span style={{ color: P.olive, fontSize: 14 }}>Active ETH</span>
              <span style={{ color: P.bark, fontWeight: 700 }}>{appState.portfolio.activeETH} ETH</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: P.olive, fontSize: 14 }}>Protected ETH</span>
              <span style={{ color: '#1E8449', fontWeight: 700 }}>{appState.portfolio.protectedETH} ETH</span>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: 11, color: P.sand, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Invoice — {appState.invoice.id}</p>
            <div className="flex justify-between" style={{ marginBottom: 8 }}>
              <span style={{ color: P.olive, fontSize: 14 }}>Status</span>
              <span style={{ color: appState.invoice.status === 'Payable' ? '#1E8449' : '#B7950B', fontWeight: 600 }}>{appState.invoice.status}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: P.olive, fontSize: 14 }}>Amount</span>
              <span style={{ color: P.bark, fontWeight: 600 }}>${appState.invoice.amount.toLocaleString()}</span>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: 11, color: P.sand, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Collateral</p>
            <div className="flex justify-between" style={{ marginBottom: 8 }}>
              <span style={{ color: P.olive, fontSize: 14 }}>Ratio</span>
              <span style={{ color: appState.collateral.ratio < 130 ? '#C0392B' : '#1E8449', fontWeight: 600 }}>{appState.collateral.ratio}%</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: P.olive, fontSize: 14 }}>Status</span>
              <span style={{ color: appState.collateral.status === 'Warning' ? '#CA6F1E' : '#1E8449', fontWeight: 600 }}>{appState.collateral.status}</span>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: 11, color: P.sand, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Escrow — {appState.escrow.id}</p>
            <div className="flex justify-between" style={{ marginBottom: 8 }}>
              <span style={{ color: P.olive, fontSize: 14 }}>Status</span>
              <span style={{ color: appState.escrow.status === 'Unlocked' ? '#1E8449' : P.olive, fontWeight: 600 }}>{appState.escrow.status}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: P.olive, fontSize: 14 }}>Amount</span>
              <span style={{ color: P.bark, fontWeight: 600 }}>${appState.escrow.amount.toLocaleString()}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent executions */}
      {recentReceipts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Executions</p>
            <Link href="/history" style={{ fontSize: 12, color: P.bark }}>View all →</Link>
          </div>
          <div className="space-y-2">
            {recentReceipts.map((r) => (
              <div key={r.id} style={{ background: '#FFFEF8', border: `1px solid ${P.sand}66`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: P.bark, fontWeight: 600, fontSize: 14 }}>{r.ruleName}</span>
                  <span style={{ color: P.olive, marginLeft: 10, fontSize: 12 }}>{r.reason}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ color: '#1E8449', fontWeight: 600, textTransform: 'uppercase' }}>{r.status}</span>
                  <span style={{ color: P.sand }}>{formatTimestamp(r.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live feed */}
      {Object.keys(feedState).length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Live Feed</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(feedState).map(([k, v]) => (
              <div key={k} style={{ border: `1px solid ${P.sand}`, borderRadius: 12, padding: 14, background: P.cream + '44' }}>
                <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: P.bark, marginTop: 4 }}>{String(v)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
