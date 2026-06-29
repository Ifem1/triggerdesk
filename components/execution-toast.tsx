'use client';

import { useEffect, useState } from 'react';
import { useSim } from '@/lib/simulation/sim-store';
import { ExecutionReceipt } from '@/lib/types/execution';

const P = { cream: '#FAE8B4', sand: '#CBBD93', olive: '#80775C', bark: '#574A24' };

interface Toast {
  id: string;
  receipt: ExecutionReceipt;
  visible: boolean;
}

export default function ExecutionToast() {
  const { receipts } = useSim();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    const latest = receipts[0];
    if (!latest || seen.has(latest.id)) return;

    setSeen((prev) => new Set(prev).add(latest.id));

    const toast: Toast = { id: latest.id, receipt: latest, visible: true };
    setToasts((prev) => [toast, ...prev].slice(0, 4));

    // fade out after 4.5s, remove after 5s
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === latest.id ? { ...t, visible: false } : t));
    }, 4500);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== latest.id));
    }, 5200);
  }, [receipts]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const r = toast.receipt;

  const actionLabel: Record<string, string> = {
    REDUCE_EXPOSURE:      'Exposure reduced',
    MARK_INVOICE_PAYABLE: 'Invoice marked payable',
    TRIGGER_WARNING:      'Warning triggered',
    UNLOCK_ESCROW:        'Escrow unlocked',
    EMIT_ALERT:           'Alert emitted',
  };

  const actionDetail: Record<string, string> = {
    REDUCE_EXPOSURE:      `Portfolio updated — 20% moved to protected`,
    MARK_INVOICE_PAYABLE: `Invoice is now ready for payment`,
    TRIGGER_WARNING:      `Collateral ratio below threshold`,
    UNLOCK_ESCROW:        `Escrow funds are now accessible`,
    EMIT_ALERT:           `Condition met and logged`,
  };

  return (
    <div
      style={{
        background: '#FFFEF8',
        border: `1.5px solid #1E8449`,
        borderRadius: 16,
        padding: '16px 18px',
        boxShadow: '0 8px 32px rgba(87,74,36,0.15)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        opacity: toast.visible ? 1 : 0,
        transform: toast.visible ? 'translateY(0)' : 'translateY(12px)',
        cursor: 'pointer',
      }}
      onClick={onDismiss}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1E8449', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1E8449', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Rule Executed
          </span>
        </div>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: P.sand, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
      </div>

      {/* Rule name */}
      <p style={{ fontWeight: 700, color: P.bark, fontSize: 15, marginBottom: 4 }}>{r.ruleName}</p>

      {/* What happened */}
      <p style={{ fontSize: 13, color: P.olive, marginBottom: 10 }}>{actionLabel[r.action] ?? r.action}</p>
      <p style={{ fontSize: 12, color: P.olive }}>{actionDetail[r.action] ?? ''}</p>

      {/* Trigger details */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        <Chip label="Observed" value={String(r.observedValue)} color="#2E86C1" />
        <Chip label="Threshold" value={String(r.threshold)} color="#B7950B" />
        <Chip label={r.predicate.replace(/_/g, ' ')} value="" color={P.olive} />
      </div>

      {/* Progress bar — depletes over 4.5s */}
      <div style={{ marginTop: 14, background: P.sand + '44', borderRadius: 99, height: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: 3, background: '#1E8449', borderRadius: 99,
            animation: toast.visible ? 'shrink 4.5s linear forwards' : 'none',
            width: '100%',
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{ fontSize: 11, fontFamily: 'monospace', color, background: color + '18', border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px' }}>
      {label}{value ? `: ${value}` : ''}
    </span>
  );
}
