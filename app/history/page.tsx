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

const P = { lightest: '#FEFCF3', cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

type UnifiedEntry =
  | { type: 'transfer'; address: string; state: ScheduledTransferState }
  | { type: 'allowance'; address: string; state: RecurringAllowanceState };

function badgeColors(entry: UnifiedEntry) {
  if (entry.type === 'transfer') {
    const map: Record<number, { bg: string; text: string; border: string }> = {
      [WORKFLOW_STATUS.PENDING]: { bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
      [WORKFLOW_STATUS.CLAIMABLE]: { bg: '#FEF9E7', text: '#B7950B', border: '#F9E79F' },
      [WORKFLOW_STATUS.CLAIMED]: { bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
      [WORKFLOW_STATUS.CANCELLED]: { bg: '#FDEDEC', text: '#C0392B', border: '#F5B7B1' },
    };
    return map[entry.state.status] ?? { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
  }
  const map: Record<number, { bg: string; text: string; border: string }> = {
    [ALLOWANCE_STATUS.ACTIVE]: { bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
    [ALLOWANCE_STATUS.COMPLETE]: { bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
    [ALLOWANCE_STATUS.CANCELLED]: { bg: '#FDEDEC', text: '#C0392B', border: '#F5B7B1' },
  };
  return map[entry.state.status] ?? { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' };
}

function isTerminal(entry: UnifiedEntry): boolean {
  if (entry.type === 'transfer') {
    return (
      entry.state.status === WORKFLOW_STATUS.CLAIMED ||
      entry.state.status === WORKFLOW_STATUS.CANCELLED ||
      entry.state.status === WORKFLOW_STATUS.CLAIMABLE
    );
  }
  return (
    entry.state.status === ALLOWANCE_STATUS.COMPLETE ||
    entry.state.status === ALLOWANCE_STATUS.CANCELLED
  );
}

export default function HistoryPage() {
  const { client, connectionStatus } = useRialo();
  const [entries, setEntries] = useState<UnifiedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [transfers, allowances] = await Promise.all([
        listWorkflows(client),
        listAllowanceWorkflows(client),
      ]);
      const unified: UnifiedEntry[] = [
        ...transfers.map((w) => ({ type: 'transfer' as const, ...w })),
        ...allowances.map((w) => ({ type: 'allowance' as const, ...w })),
      ];
      setEntries(unified);
      setFetchFailed(false);
    } catch {
      setEntries([]);
      setFetchFailed(true);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const terminal = entries.filter(isTerminal);

  return (
    <div style={{ color: P.bark }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>Workflow History</h1>
          <p style={{ color: P.olive, fontSize: 13, marginTop: 4 }}>
            On-chain workflow executions — read directly from DevNet
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 rounded-lg text-xs border transition-all hover:opacity-80"
          style={{ borderColor: P.sand + '88', color: P.olive }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div
          style={{
            border: `1px dashed ${P.sand}`,
            borderRadius: 14,
            padding: 40,
            textAlign: 'center',
            color: P.olive,
          }}
        >
          Loading history from DevNet...
        </div>
      ) : terminal.length === 0 && (fetchFailed || connectionStatus === 'error') ? (
        <div
          style={{
            border: '1px solid #F5B7B1',
            background: '#FDEDEC',
            borderRadius: 14,
            padding: 56,
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#C0392B', fontSize: 15, fontWeight: 600 }}>Can&apos;t reach Rialo DevNet</p>
          <p style={{ color: '#C0392B', fontSize: 13, marginTop: 8 }}>
            This isn&apos;t necessarily empty history — the RPC connection may be down.
            Check your network and try refreshing.
          </p>
        </div>
      ) : terminal.length === 0 ? (
        <div
          style={{
            border: `1px dashed ${P.sand}`,
            borderRadius: 14,
            padding: 56,
            textAlign: 'center',
          }}
        >
          <p style={{ color: P.olive, fontSize: 15 }}>No completed workflows yet.</p>
          <p style={{ color: P.sand, fontSize: 13, marginTop: 8 }}>
            Create a workflow and wait for the AFTER callback(s) to fire.{' '}
            <Link href="/workflows/new" style={{ color: P.bark, fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {terminal.map((entry) => {
            const c = badgeColors(entry);
            const statusLabel = entry.type === 'transfer'
              ? getStatusLabel(entry.state.status)
              : getAllowanceStatusLabel(entry.state.status);
            const title = entry.type === 'transfer' ? 'Scheduled Transfer' : 'Recurring Allowance';

            return (
              <Link
                key={entry.address}
                href={`/workflows/${entry.address}`}
                style={{
                  display: 'block',
                  border: `1px solid ${P.sand}88`,
                  borderRadius: 16,
                  padding: 20,
                  background: '#FFFEF8',
                  textDecoration: 'none',
                  color: P.bark,
                }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 16 }}>{title}</p>
                    <p
                      style={{
                        fontSize: 11,
                        color: P.sand,
                        fontFamily: 'monospace',
                        marginTop: 2,
                      }}
                    >
                      {entry.address}
                    </p>
                  </div>
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded-lg border uppercase tracking-widest whitespace-nowrap"
                    style={{ color: c.text, borderColor: c.border, background: c.bg }}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {entry.type === 'transfer' ? (
                    <>
                      <StatBox label="Amount" value={`${formatKelvinAsRlo(entry.state.amountKelvin)} RLO`} />
                      <StatBox label="Recipient" value={entry.state.recipient.slice(0, 8) + '...'} />
                      <StatBox label="Scheduled" value={new Date(Number(entry.state.scheduledAt) * 1000).toLocaleString()} />
                      <StatBox label="Status" value={getStatusLabel(entry.state.status)} />
                    </>
                  ) : (
                    <>
                      <StatBox label="Per Distribution" value={`${formatKelvinAsRlo(entry.state.amountKelvin)} RLO`} />
                      <StatBox label="Recipient" value={entry.state.recipient.slice(0, 8) + '...'} />
                      <StatBox label="Distributions" value={`${entry.state.distributionCount} / 3`} />
                      <StatBox label="Total Sent" value={`${formatKelvinAsRlo(entry.state.totalDistributed)} RLO`} />
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: P.lightest,
        border: `1px solid ${P.sand}55`,
        borderRadius: 10,
        padding: '10px 14px',
      }}
    >
      <p
        style={{
          fontSize: 10,
          color: P.olive,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontWeight: 700,
          fontFamily: 'monospace',
          fontSize: 13,
          color: P.bark,
        }}
      >
        {value}
      </p>
    </div>
  );
}
