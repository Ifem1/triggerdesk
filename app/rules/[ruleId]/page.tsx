'use client';

import { use } from 'react';
import { useSim } from '@/lib/simulation/sim-store';
import RuleStateBadge from '@/components/rules/rule-state-badge';
import { formatTimestamp } from '@/lib/utils/format';
import Link from 'next/link';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

const STATE_FLOW = ['DRAFT','WAITING','ELIGIBLE','TRIGGERED','EXECUTED'];

export default function RuleDetailPage({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = use(params);
  const { rules, receipts } = useSim();
  const rule = rules.find((r) => r.id === ruleId);
  const ruleReceipts = receipts.filter((r) => r.ruleId === ruleId);

  if (!rule) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: P.olive }}>
      Rule not found.{' '}
      <Link href="/dashboard" style={{ color: P.bark, fontWeight: 600 }}>Back to dashboard</Link>
    </div>
  );

  const currentIdx = STATE_FLOW.indexOf(rule.status);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', color: P.bark }} className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" style={{ fontSize: 12, color: P.olive }}>← Dashboard</Link>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: P.bark, marginTop: 8 }}>{rule.name}</h1>
          <p style={{ fontSize: 12, color: P.olive, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rule.ruleType} Rule · {rule.id}</p>
        </div>
        <RuleStateBadge status={rule.status} />
      </div>

      {/* State timeline */}
      <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: '#FFFEF8' }}>
        <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>State Timeline</p>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
          {STATE_FLOW.map((s, i) => {
            const active  = i <= currentIdx;
            const current = i === currentIdx;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: current ? P.bark : active ? P.sand : '#E8E0D0',
                    border: `2px solid ${current ? P.bark : active ? P.olive : P.sand}`,
                    boxShadow: current ? `0 0 0 4px ${P.cream}` : 'none',
                  }} />
                  <span style={{ fontSize: 10, marginTop: 6, color: current ? P.bark : active ? P.olive : P.sand, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</span>
                </div>
                {i < STATE_FLOW.length - 1 && (
                  <div style={{ width: 40, height: 2, background: active && i < currentIdx ? P.olive : P.sand + '55', marginBottom: 16, margin: '0 4px 16px 4px' }} />
                )}
              </div>
            );
          })}
          {['FAILED','EXPIRED','CANCELLED'].includes(rule.status) && (
            <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#C0392B', border: '2px solid #C0392B' }} />
              <span style={{ fontSize: 10, marginTop: 6, color: '#C0392B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{rule.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rule definition */}
      <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: '#FFFEF8' }}>
        <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Rule Definition</p>
        <div style={{ background: P.lightest, border: `1px solid ${P.sand}55`, borderRadius: 10, padding: 14, fontFamily: 'monospace', fontSize: 13 }}>
          {[
            { label: 'inputKey',     value: rule.inputKey,                     color: '#2E86C1' },
            { label: 'predicate',    value: rule.predicate,                    color: '#B7950B' },
            { label: 'threshold',    value: String(rule.threshold),            color: '#1E8449' },
            { label: 'action',       value: rule.actionType,                   color: '#6C3483' },
            { label: 'status',       value: rule.status,                       color: P.bark },
            { label: 'createdAt',    value: formatTimestamp(rule.createdAt),   color: P.olive },
            ...(rule.simulatedSignature ? [{ label: 'simulatedSig', value: rule.simulatedSignature, color: P.sand }] : []),
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              <span style={{ color: P.sand, width: 120, flexShrink: 0 }}>{label}:</span>
              <span style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div style={{ border: `1px solid ${P.sand}`, borderRadius: 16, padding: 20, background: P.cream + '33' }}>
        <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Condition</p>
        <p style={{ fontFamily: 'monospace', fontSize: 14 }}>
          <span style={{ color: P.olive }}>IF </span>
          <span style={{ color: '#2E86C1' }}>{rule.inputKey} </span>
          <span style={{ color: '#B7950B' }}>{rule.predicate.replace(/_/g, ' ')} </span>
          <span style={{ color: '#1E8449' }}>{String(rule.threshold)} </span>
          <span style={{ color: P.olive }}>→ </span>
          <span style={{ color: '#6C3483' }}>{rule.actionType.replace(/_/g, ' ')}</span>
        </p>
      </div>

      {/* Receipts */}
      {ruleReceipts.length > 0 ? (
        <div className="space-y-3">
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Execution Receipts</p>
          {ruleReceipts.map((r) => (
            <div key={r.id} style={{ border: `1px solid ${P.sand}`, borderRadius: 14, padding: 16, background: '#FFFEF8' }} className="space-y-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: P.sand, fontFamily: 'monospace' }}>{r.id}</span>
                <span style={{ color: '#1E8449', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{r.status}</span>
              </div>
              <p style={{ color: P.bark, fontSize: 14 }}>{r.reason}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ background: P.lightest, border: `1px solid ${P.sand}55`, borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, color: P.olive, textTransform: 'uppercase' }}>Observed</p>
                  <p style={{ color: '#2E86C1', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{String(r.observedValue)}</p>
                </div>
                <div style={{ background: P.lightest, border: `1px solid ${P.sand}55`, borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, color: P.olive, textTransform: 'uppercase' }}>Threshold</p>
                  <p style={{ color: '#B7950B', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{String(r.threshold)}</p>
                </div>
              </div>
              <p style={{ fontSize: 11, color: P.sand }}>{formatTimestamp(r.timestamp)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ border: `1px dashed ${P.sand}`, borderRadius: 14, padding: 32, textAlign: 'center', color: P.olive, fontSize: 14 }}>
          No executions yet.{' '}
          <Link href="/replay" style={{ color: P.bark, fontWeight: 600 }}>Run a replay →</Link>
        </div>
      )}
    </div>
  );
}
