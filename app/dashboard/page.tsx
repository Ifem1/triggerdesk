'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRialo } from '@/lib/rialo/provider';
import {
  listWorkflows,
  formatKelvinAsRlo,
  getStatusLabel,
} from '@/lib/rialo/scheduled-transfer';
import {
  listAllowanceWorkflows,
  getAllowanceStatusLabel,
} from '@/lib/rialo/recurring-allowance';
import { WORKFLOW_STATUS, ALLOWANCE_STATUS } from '@/lib/rialo/constants';
import type { ScheduledTransferState, RecurringAllowanceState } from '@/lib/rialo/types';
import { getMyWorkflowAddresses } from '@/lib/rialo/my-workflows';

const P = { lightest: '#FEFCF3', cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

type UnifiedEntry =
  | { type: 'transfer'; address: string; state: ScheduledTransferState }
  | { type: 'allowance'; address: string; state: RecurringAllowanceState };

function StatusBadge({ label, status }: { label: string; status: 'active' | 'done' | 'error' | 'pending' }) {
  const colors = {
    active: { bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
    pending: { bg: '#FEF9E7', text: '#B7950B', border: '#F9E79F' },
    done: { bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
    error: { bg: '#FDEDEC', text: '#C0392B', border: '#F5B7B1' },
  };
  const c = colors[status];

  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded-lg border uppercase tracking-widest whitespace-nowrap"
      style={{ color: c.text, borderColor: c.border, background: c.bg }}
    >
      {label}
    </span>
  );
}

function getUnifiedStatus(entry: UnifiedEntry): { label: string; badge: 'active' | 'done' | 'error' | 'pending' } {
  if (entry.type === 'transfer') {
    const s = entry.state.status;
    if (s === WORKFLOW_STATUS.PENDING) return { label: getStatusLabel(s), badge: 'active' };
    if (s === WORKFLOW_STATUS.CLAIMABLE) return { label: getStatusLabel(s), badge: 'pending' };
    if (s === WORKFLOW_STATUS.CLAIMED) return { label: getStatusLabel(s), badge: 'done' };
    if (s === WORKFLOW_STATUS.CANCELLED) return { label: getStatusLabel(s), badge: 'error' };
    return { label: getStatusLabel(s), badge: 'pending' };
  } else {
    const s = entry.state.status;
    if (s === ALLOWANCE_STATUS.ACTIVE) return { label: getAllowanceStatusLabel(s), badge: 'active' };
    if (s === ALLOWANCE_STATUS.COMPLETE) return { label: getAllowanceStatusLabel(s), badge: 'done' };
    if (s === ALLOWANCE_STATUS.CANCELLED) return { label: getAllowanceStatusLabel(s), badge: 'error' };
    return { label: getAllowanceStatusLabel(s), badge: 'pending' };
  }
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#FFFEF8', border: `1px solid ${P.sand}88`, borderRadius: 16, padding: 20, ...style }}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { client, wallet, connectionStatus, blockHeight } = useRialo();
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [transfers, allowances] = await Promise.all([
        listWorkflows(client),
        listAllowanceWorkflows(client),
      ]);
      // These two calls return every workflow on the program, from every
      // wallet that's ever used it - filter down to just the connected
      // wallet's own workflows. See lib/rialo/my-workflows.ts.
      const mine = wallet.publicKey ? getMyWorkflowAddresses(wallet.publicKey) : new Set<string>();
      const unified: UnifiedEntry[] = [
        ...transfers.filter((w) => mine.has(w.address)).map((w) => ({ type: 'transfer' as const, ...w })),
        ...allowances.filter((w) => mine.has(w.address)).map((w) => ({ type: 'allowance' as const, ...w })),
      ];
      setEntries(unified);
      setFetchFailed(false);
    } catch {
      setEntries([]);
      setFetchFailed(true);
    }
    setLoading(false);
  }, [client, wallet.publicKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const active = entries.filter((e) => {
    if (e.type === 'transfer') return e.state.status === WORKFLOW_STATUS.PENDING;
    return e.state.status === ALLOWANCE_STATUS.ACTIVE;
  });
  const completed = entries.filter((e) => {
    if (e.type === 'transfer') return e.state.status === WORKFLOW_STATUS.CLAIMED || e.state.status === WORKFLOW_STATUS.CLAIMABLE;
    return e.state.status === ALLOWANCE_STATUS.COMPLETE;
  });
  const cancelled = entries.filter((e) => {
    if (e.type === 'transfer') return e.state.status === WORKFLOW_STATUS.CANCELLED;
    return e.state.status === ALLOWANCE_STATUS.CANCELLED;
  });

  return (
    <div style={{ color: P.bark }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: P.bark, fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
            {connectionStatus === 'connected'
              ? `Rialo DevNet — Block ${blockHeight?.toString() ?? '—'}`
              : connectionStatus === 'connecting'
                ? 'Connecting to DevNet...'
                : 'Connection error'}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: P.bark,
              color: P.cream,
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + New Workflow
          </button>
          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: 8,
                background: '#FFFEF8',
                border: `1px solid ${P.sand}`,
                borderRadius: 12,
                padding: 8,
                minWidth: 220,
                zIndex: 50,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <Link
                href="/workflows/new"
                onClick={() => setShowMenu(false)}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: P.bark,
                  fontSize: 13,
                }}
                className="hover:opacity-80"
              >
                <span style={{ fontWeight: 600 }}>Scheduled Transfer</span>
                <span style={{ display: 'block', fontSize: 11, color: P.olive, marginTop: 2 }}>
                  One-time future send with AFTER
                </span>
              </Link>
              <Link
                href="/workflows/new-allowance"
                onClick={() => setShowMenu(false)}
                style={{
                  display: 'block',
                  padding: '10px 14px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: P.bark,
                  fontSize: 13,
                }}
                className="hover:opacity-80"
              >
                <span style={{ fontWeight: 600 }}>Recurring Allowance</span>
                <span style={{ display: 'block', fontSize: 11, color: P.olive, marginTop: 2 }}>
                  3 distributions at fixed interval
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {!wallet.publicKey && (
        <Card>
          <p style={{ color: P.olive, fontSize: 14, textAlign: 'center', padding: 20 }}>
            Connect a wallet to create and manage workflows.
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Workflows', value: entries.length, color: P.bark },
          { label: 'Active', value: active.length, color: '#2E86C1' },
          { label: 'Completed', value: completed.length, color: '#1E8449' },
          { label: 'Cancelled', value: cancelled.length, color: '#C0392B' },
        ].map((s) => (
          <Card key={s.label}>
            <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.label}
            </p>
            <p style={{ fontSize: 36, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Workflows list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            On-Chain Workflows
          </p>
          <button
            onClick={refresh}
            style={{ fontSize: 12, color: P.bark, cursor: 'pointer', background: 'none', border: 'none' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div
            style={{
              border: `1px dashed ${P.sand}`,
              borderRadius: 14,
              padding: 32,
              textAlign: 'center',
              color: P.olive,
              fontSize: 14,
            }}
          >
            Loading workflows from DevNet...
          </div>
        ) : entries.length === 0 && (fetchFailed || connectionStatus === 'error') ? (
          <div
            style={{
              border: '1px solid #F5B7B1',
              background: '#FDEDEC',
              borderRadius: 14,
              padding: 32,
              textAlign: 'center',
              color: '#C0392B',
              fontSize: 14,
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Can&apos;t reach Rialo DevNet</p>
            <p style={{ fontSize: 13 }}>
              This isn&apos;t necessarily an empty list — the RPC connection may be down.
              Check your network and try refreshing.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div
            style={{
              border: `1px dashed ${P.sand}`,
              borderRadius: 14,
              padding: 32,
              textAlign: 'center',
              color: P.olive,
              fontSize: 14,
            }}
          >
            No workflows found. Create one using the button above.
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const { label, badge } = getUnifiedStatus(entry);

              return (
                <Link
                  key={entry.address}
                  href={`/workflows/${entry.address}`}
                  style={{
                    display: 'block',
                    background: '#FFFEF8',
                    border: `1px solid ${P.sand}88`,
                    borderRadius: 14,
                    padding: '16px 20px',
                    textDecoration: 'none',
                    color: P.bark,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>
                        {entry.type === 'transfer' ? 'Scheduled Transfer' : 'Recurring Allowance'}
                      </p>
                      <p style={{ color: P.olive, fontSize: 12, marginTop: 4 }}>
                        {entry.type === 'transfer'
                          ? `${formatKelvinAsRlo(entry.state.amountKelvin)} RLO to ${entry.state.recipient.slice(0, 8)}...`
                          : `${formatKelvinAsRlo(entry.state.amountKelvin)} RLO × 3 to ${entry.state.recipient.slice(0, 8)}...`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {entry.type === 'allowance' && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: P.olive }}>Distributions</p>
                          <p style={{ fontSize: 12, color: P.bark }}>
                            {(entry.state as RecurringAllowanceState).distributionCount.toString()} / 3
                          </p>
                        </div>
                      )}
                      {entry.type === 'transfer' && (
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 11, color: P.olive }}>
                            {new Date(Number((entry.state as ScheduledTransferState).scheduledAt) * 1000).getTime() < Date.now()
                              ? 'Scheduled for'
                              : 'Fires at'}
                          </p>
                          <p style={{ fontSize: 12, color: P.bark }}>
                            {new Date(Number((entry.state as ScheduledTransferState).scheduledAt) * 1000).toLocaleString()}
                          </p>
                        </div>
                      )}
                      <StatusBadge label={label} status={badge} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
