'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSim } from '@/lib/simulation/sim-store';
import { TriggerRule, RuleType, Predicate, ActionType } from '@/lib/types/rule';
import { generateId } from '@/lib/utils/ids';
import { validateRule } from '@/lib/utils/validation';

const P = { lightest:'#FEFCF3', cream:'#FAE8B4', sand:'#CBBD93', olive:'#80775C', bark:'#574A24' };

const RULE_TYPES: { value: RuleType; label: string; desc: string }[] = [
  { value: 'PRICE',      label: 'Price Rule',      desc: 'Trigger on asset price movement' },
  { value: 'TIME',       label: 'Time Rule',        desc: 'Trigger when a date/time is reached' },
  { value: 'INVOICE',    label: 'Invoice Rule',     desc: 'Trigger on invoice due date' },
  { value: 'COLLATERAL', label: 'Collateral Rule',  desc: 'Trigger on collateral ratio' },
  { value: 'ESCROW',     label: 'Escrow Rule',      desc: 'Trigger on delivery status' },
];

const PREDICATES_BY_TYPE: Record<RuleType, { value: Predicate; label: string }[]> = {
  PRICE:      [{ value: 'LESS_THAN',    label: 'Falls below' }, { value: 'GREATER_THAN', label: 'Rises above' }],
  TIME:       [{ value: 'DATE_REACHED', label: 'Date is reached' }],
  INVOICE:    [{ value: 'DATE_REACHED', label: 'Due date reached' }],
  COLLATERAL: [{ value: 'RATIO_BELOW',  label: 'Ratio drops below' }],
  ESCROW:     [{ value: 'EQUALS',       label: 'Equals' }],
};

const ACTIONS_BY_TYPE: Record<RuleType, { value: ActionType; label: string }[]> = {
  PRICE:      [{ value: 'REDUCE_EXPOSURE',      label: 'Reduce exposure by 20%' }],
  TIME:       [{ value: 'EMIT_ALERT',           label: 'Emit alert' }],
  INVOICE:    [{ value: 'MARK_INVOICE_PAYABLE', label: 'Mark invoice as payable' }],
  COLLATERAL: [{ value: 'TRIGGER_WARNING',      label: 'Trigger collateral warning' }],
  ESCROW:     [{ value: 'UNLOCK_ESCROW',        label: 'Unlock escrow' }],
};

const INPUT_KEYS_BY_TYPE: Record<RuleType, string> = {
  PRICE: 'ETH_USD', TIME: 'DEMO_CLOCK', INVOICE: 'INVOICE_DUE_DATE', COLLATERAL: 'COLLATERAL_RATIO', ESCROW: 'DELIVERY_STATUS',
};

const DEFAULT_THRESHOLDS: Record<RuleType, string> = {
  PRICE: '3000', TIME: new Date().toISOString(), INVOICE: new Date().toISOString(), COLLATERAL: '130', ESCROW: 'confirmed',
};

export default function NewRulePage() {
  const router = useRouter();
  const { addRule } = useSim();
  const [ruleType, setRuleType] = useState<RuleType>('PRICE');
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLDS['PRICE']);
  const [errors, setErrors] = useState<string[]>([]);

  const predicates = PREDICATES_BY_TYPE[ruleType];
  const actions    = ACTIONS_BY_TYPE[ruleType];

  function handleTypeChange(t: RuleType) { setRuleType(t); setThreshold(DEFAULT_THRESHOLDS[t]); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const partial = { name, ruleType, predicate: predicates[0].value, threshold: ruleType === 'PRICE' || ruleType === 'COLLATERAL' ? Number(threshold) : threshold, actionType: actions[0].value };
    const errs = validateRule(partial);
    if (errs.length > 0) { setErrors(errs); return; }
    const rule: TriggerRule = {
      id: generateId('rule'), ownerId: 'demo-user', name, ruleType,
      inputKey: INPUT_KEYS_BY_TYPE[ruleType], predicate: predicates[0].value,
      threshold: partial.threshold, actionType: actions[0].value,
      actionParams: ruleType === 'PRICE' ? { reductionPct: 0.2 } : {},
      status: 'WAITING', createdAt: new Date().toISOString(),
      simulatedSignature: '0xSIM_' + Math.random().toString(16).slice(2, 18),
    };
    addRule(rule);
    router.push(`/rules/${rule.id}`);
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', color: P.bark }} className="space-y-8">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: P.bark }}>New Rule</h1>
        <p style={{ color: P.olive, fontSize: 14, marginTop: 4 }}>Define a conditional trigger rule</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Rule Name</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ETH Price Protection"
            style={{ width: '100%', background: '#FFFEF8', border: `1px solid ${P.sand}`, borderRadius: 10, padding: '10px 14px', color: P.bark, fontSize: 14, outline: 'none' }}
          />
        </div>

        {/* Type */}
        <div>
          <label style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Rule Type</label>
          <div className="space-y-2">
            {RULE_TYPES.map((rt) => (
              <button
                key={rt.value} type="button" onClick={() => handleTypeChange(rt.value)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12,
                  border: `1px solid ${ruleType === rt.value ? P.bark : P.sand}`,
                  background: ruleType === rt.value ? P.cream + '66' : '#FFFEF8',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <p style={{ fontWeight: 600, color: P.bark, fontSize: 14 }}>{rt.label}</p>
                <p style={{ color: P.olive, fontSize: 12, marginTop: 2 }}>{rt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div style={{ border: `1px solid ${P.sand}`, borderRadius: 14, padding: 16, background: P.cream + '33' }}>
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Condition</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, fontFamily: 'monospace', fontSize: 13 }}>
            <span style={{ color: P.olive }}>IF</span>
            <span style={{ color: '#2E86C1', background: '#EBF5FB', padding: '2px 8px', borderRadius: 6 }}>{INPUT_KEYS_BY_TYPE[ruleType]}</span>
            <span style={{ color: '#B7950B' }}>{predicates[0].label}</span>
            <input
              value={threshold} onChange={(e) => setThreshold(e.target.value)}
              style={{ background: '#FFFEF8', border: `1px solid ${P.sand}`, borderRadius: 8, padding: '4px 10px', color: '#1E8449', width: 160, fontFamily: 'monospace', fontSize: 13, outline: 'none' }}
            />
          </div>
        </div>

        {/* Action */}
        <div style={{ border: `1px solid ${P.sand}`, borderRadius: 14, padding: 16, background: P.cream + '33' }}>
          <p style={{ fontSize: 11, color: P.olive, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Action</p>
          <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
            <span style={{ color: P.olive }}>THEN </span>
            <span style={{ color: '#6C3483', background: '#F5EEF8', padding: '2px 8px', borderRadius: 6 }}>{actions[0].label}</span>
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ border: '1px solid #F5B7B1', background: '#FDEDEC', borderRadius: 10, padding: 14, color: '#C0392B', fontSize: 13 }}>
            {errors.map((e) => <p key={e}>• {e}</p>)}
          </div>
        )}

        <button type="submit" style={{ width: '100%', padding: '14px', background: P.bark, color: P.cream, fontWeight: 700, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Activate Rule
        </button>
      </form>
    </div>
  );
}
