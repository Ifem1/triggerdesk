'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRialo } from '@/lib/rialo/provider';
import {
  getWorkflowState,
  formatKelvinAsRlo,
  getStatusLabel,
} from '@/lib/rialo/scheduled-transfer';
import {
  getAllowanceState,
  getAllowanceStatusLabel,
} from '@/lib/rialo/recurring-allowance';
import {
  WORKFLOW_STATUS,
  ALLOWANCE_STATUS,
  SCHEDULED_TRANSFER_PROGRAM_ID,
  RECURRING_ALLOWANCE_PROGRAM_ID,
} from '@/lib/rialo/constants';
import type { ScheduledTransferState, RecurringAllowanceState } from '@/lib/rialo/types';
import { resolveCreatedAt } from '@/lib/rialo/client-timestamps';
import { PublicKey } from '@rialo/ts-cdk';

const P = { lightest: '#FEFCF3', cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

type WorkflowType = 'scheduled-transfer' | 'recurring-allowance' | 'unknown';
type AnyState = ScheduledTransferState | RecurringAllowanceState;

function TransferTimeline({ status }: { status: number }) {
  const steps = [
    { label: 'Created', done: status >= WORKFLOW_STATUS.PENDING },
    { label: 'Pending', done: status >= WORKFLOW_STATUS.PENDING, active: status === WORKFLOW_STATUS.PENDING },
    { label: 'Triggered', done: status >= WORKFLOW_STATUS.CLAIMABLE },
    { label: 'Claimable', done: status >= WORKFLOW_STATUS.CLAIMABLE, active: status === WORKFLOW_STATUS.CLAIMABLE },
  ];

  if (status === WORKFLOW_STATUS.CANCELLED) {
    steps.push({ label: 'Cancelled', done: true, active: true });
  }

  return <TimelineRow steps={steps} />;
}

function AllowanceTimeline({ state }: { state: RecurringAllowanceState }) {
  const count = Number(state.distributionCount);
  const steps = [
    { label: 'Created', done: state.status >= ALLOWANCE_STATUS.ACTIVE },
    { label: `1/3`, done: count >= 1, active: state.status === ALLOWANCE_STATUS.ACTIVE && count === 0 },
    { label: `2/3`, done: count >= 2, active: state.status === ALLOWANCE_STATUS.ACTIVE && count === 1 },
    { label: `3/3`, done: count >= 3, active: state.status === ALLOWANCE_STATUS.ACTIVE && count === 2 },
    { label: 'Complete', done: state.status === ALLOWANCE_STATUS.COMPLETE },
  ];

  if (state.status === ALLOWANCE_STATUS.CANCELLED) {
    steps.push({ label: 'Cancelled', done: true, active: true });
  }

  return <TimelineRow steps={steps} />;
}

function TimelineRow({ steps }: { steps: Array<{ label: string; done: boolean; active?: boolean }> }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <div
              className="w-3 h-3 rounded-full border-2"
              style={{
                borderColor: step.done ? '#1E8449' : P.sand,
                background: step.done ? '#1E8449' : 'transparent',
              }}
            />
            <span
              className="text-xs mt-1"
              style={{
                color: step.active ? P.bark : step.done ? '#1E8449' : P.sand,
                fontWeight: step.active ? 600 : 400,
              }}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-8 h-0.5 mb-4"
              style={{ background: step.done ? '#1E8449' : P.sand + '66' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const address = params.address as string;
  const { client } = useRialo();

  const [workflowType, setWorkflowType] = useState<WorkflowType>('unknown');
  const [state, setState] = useState<AnyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const info = await client.getAccountInfo(PublicKey.fromString(address));
      if (!info || !info.data || !info.data[0]) {
        setError('Workflow not found on chain. It may still be confirming — try refreshing.');
        setLoading(false);
        return;
      }

      const owner = info.owner?.toString?.() ?? '';

      if (owner === RECURRING_ALLOWANCE_PROGRAM_ID) {
        const allowanceState = await getAllowanceState(client, address);
        if (allowanceState && allowanceState.discriminator !== 0n) {
          setWorkflowType('recurring-allowance');
          setState(allowanceState);
          setError(null);
          setLoading(false);
          return;
        }
      } else {
        const transferState = await getWorkflowState(client, address);
        if (transferState && transferState.discriminator !== 0n) {
          setWorkflowType('scheduled-transfer');
          setState(transferState);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setError('Workflow not found on chain. It may still be confirming — try refreshing.');
    } catch {
      setError('Failed to read workflow state.');
    }
    setLoading(false);
  }, [client, address]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) {
    return (
      <div style={{ color: P.olive, textAlign: 'center', padding: 40 }}>
        Loading workflow from DevNet...
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="space-y-4" style={{ color: P.bark }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Workflow Detail</h1>
        <div
          style={{
            background: '#FDEDEC',
            border: '1px solid #F5B7B1',
            borderRadius: 12,
            padding: 16,
            color: '#C0392B',
          }}
        >
          {error ?? 'Workflow not found.'}
        </div>
        <Link href="/dashboard" style={{ color: P.bark, fontSize: 13 }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const programId = workflowType === 'recurring-allowance'
    ? RECURRING_ALLOWANCE_PROGRAM_ID
    : SCHEDULED_TRANSFER_PROGRAM_ID;

  const title = workflowType === 'recurring-allowance'
    ? 'Recurring Allowance'
    : 'Scheduled Transfer';

  return (
    <div style={{ color: P.bark }} className="space-y-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" style={{ color: P.olive, fontSize: 12 }}>
            ← Dashboard
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{title}</h1>
        </div>
        <button
          onClick={refresh}
          className="px-3 py-1.5 rounded-lg text-xs border transition-all hover:opacity-80"
          style={{ borderColor: P.sand + '88', color: P.olive }}
        >
          Refresh
        </button>
      </div>

      {/* Status timeline */}
      <div
        style={{
          background: '#FFFEF8',
          border: `1px solid ${P.sand}88`,
          borderRadius: 16,
          padding: 24,
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: P.olive,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 16,
          }}
        >
          Workflow Status
        </p>
        {workflowType === 'recurring-allowance' ? (
          <AllowanceTimeline state={state as RecurringAllowanceState} />
        ) : (
          <TransferTimeline status={state.status} />
        )}
      </div>

      {/* Details */}
      <div
        style={{
          background: '#FFFEF8',
          border: `1px solid ${P.sand}88`,
          borderRadius: 16,
          padding: 24,
        }}
        className="space-y-4"
      >
        <p
          style={{
            fontSize: 11,
            color: P.olive,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title} Details
        </p>

        {workflowType === 'recurring-allowance'
          ? renderAllowanceDetails(state as RecurringAllowanceState, address)
          : renderTransferDetails(state as ScheduledTransferState)}
      </div>

      {/* On-chain data */}
      <div
        style={{
          background: '#FFFEF8',
          border: `1px solid ${P.sand}88`,
          borderRadius: 16,
          padding: 24,
        }}
        className="space-y-4"
      >
        <p
          style={{
            fontSize: 11,
            color: P.olive,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          On-Chain Data
        </p>

        {[
          { label: 'Workflow PDA', value: address },
          { label: 'Program', value: programId },
          { label: 'Discriminator', value: state.discriminator.toString() },
        ].map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} mono />
        ))}
      </div>

      {/* Contextual info */}
      {workflowType === 'recurring-allowance' && renderAllowanceInfo(state as RecurringAllowanceState)}
      {workflowType === 'scheduled-transfer' && renderTransferInfo(state as ScheduledTransferState)}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex justify-between items-start py-2"
      style={{ borderBottom: `1px solid ${P.sand}33` }}
    >
      <span style={{ fontSize: 13, color: P.olive }}>{label}</span>
      <span
        style={{
          fontSize: mono ? 11 : 13,
          fontWeight: 600,
          color: P.bark,
          textAlign: 'right',
          maxWidth: '60%',
          wordBreak: 'break-all',
          fontFamily: mono ? 'monospace' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function renderTransferDetails(state: ScheduledTransferState) {
  const scheduledDate = new Date(Number(state.scheduledAt) * 1000);
  const isPast = scheduledDate.getTime() < Date.now();
  const timeUntil = isPast
    ? 'Already passed'
    : `${Math.ceil((scheduledDate.getTime() - Date.now()) / 60_000)} minutes`;

  // Once the chain reports a status past Pending, the AFTER callback has
  // already fired - the on-chain status is ground truth. A client-clock-
  // derived "time remaining" countdown at that point is misleading (device
  // clock drift can make the chain look ahead of or behind local time), so
  // only show it while still genuinely waiting on the callback.
  const showCountdown = state.status === WORKFLOW_STATUS.PENDING;

  return (
    <>
      <DetailRow label="Recipient" value={state.recipient} mono />
      <DetailRow label="Amount" value={`${formatKelvinAsRlo(state.amountKelvin)} RLO`} />
      <DetailRow label="Scheduled At" value={scheduledDate.toLocaleString()} />
      {showCountdown && <DetailRow label="Time Remaining" value={timeUntil} />}
      <DetailRow label="Status" value={getStatusLabel(state.status)} />
    </>
  );
}

function renderAllowanceDetails(state: RecurringAllowanceState, address: string) {
  const createdDate = resolveCreatedAt(address, state.createdAt);
  const intervalMin = Number(state.intervalSeconds) / 60;
  const perDistribution = formatKelvinAsRlo(state.amountKelvin);
  const totalDist = formatKelvinAsRlo(state.totalDistributed);

  return (
    <>
      <DetailRow label="Recipient" value={state.recipient} mono />
      <DetailRow label="Per Distribution" value={`${perDistribution} RLO`} />
      <DetailRow label="Interval" value={`${intervalMin} minutes`} />
      <DetailRow label="Distributions" value={`${state.distributionCount} / 3`} />
      <DetailRow label="Total Distributed" value={`${totalDist} RLO`} />
      <DetailRow
        label="Created"
        value={createdDate ? createdDate.toLocaleString() : 'Unknown (created in another browser)'}
      />
      <DetailRow label="Status" value={getAllowanceStatusLabel(state.status)} />
    </>
  );
}

function renderTransferInfo(state: ScheduledTransferState) {
  if (state.status === WORKFLOW_STATUS.PENDING) {
    return (
      <div
        style={{
          background: '#EBF5FB',
          border: '1px solid #AED6F1',
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: '#2E86C1',
        }}
      >
        The AFTER subscription is active on DevNet. The Rialo network will fire the callback
        automatically at the scheduled time — no keeper or cron job is involved. Refresh this
        page to see when the status changes to Claimable.
      </div>
    );
  }

  if (state.status === WORKFLOW_STATUS.CLAIMABLE) {
    return (
      <div
        style={{
          background: '#FEF9E7',
          border: '1px solid #F9E79F',
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: '#B7950B',
        }}
      >
        The AFTER callback has fired. The workflow is now claimable. The native trigger executed
        automatically on the Rialo network without any off-chain infrastructure.
      </div>
    );
  }

  return null;
}

function renderAllowanceInfo(state: RecurringAllowanceState) {
  if (state.status === ALLOWANCE_STATUS.ACTIVE) {
    const remaining = 3 - Number(state.distributionCount);
    return (
      <div
        style={{
          background: '#EBF5FB',
          border: '1px solid #AED6F1',
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: '#2E86C1',
        }}
      >
        {remaining} AFTER subscription{remaining !== 1 ? 's' : ''} remaining on DevNet.
        Each fires at the configured interval — no keeper or cron job is involved.
        Refresh this page to track distribution progress.
      </div>
    );
  }

  if (state.status === ALLOWANCE_STATUS.COMPLETE) {
    return (
      <div
        style={{
          background: '#EAFAF1',
          border: '1px solid #A9DFBF',
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: '#1E8449',
        }}
      >
        All 3 distributions have been completed. {formatKelvinAsRlo(state.totalDistributed)} RLO
        total was distributed via native AFTER callbacks — no off-chain infrastructure was used.
      </div>
    );
  }

  if (state.status === ALLOWANCE_STATUS.CANCELLED) {
    return (
      <div
        style={{
          background: '#FDEDEC',
          border: '1px solid #F5B7B1',
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: '#C0392B',
        }}
      >
        Allowance was cancelled after {state.distributionCount.toString()} distribution(s).
      </div>
    );
  }

  return null;
}
