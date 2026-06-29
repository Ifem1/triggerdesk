'use client';

import Link from 'next/link';
import { TriggerRule } from '@/lib/types/rule';
import RuleStateBadge from './rule-state-badge';
import { useSim } from '@/lib/simulation/sim-store';

export default function RuleCard({ rule }: { rule: TriggerRule }) {
  const { cancelRule } = useSim();

  return (
    <div
      className="card-lift rounded-xl p-4 flex flex-col gap-3 border transition-all"
      style={{ background: '#FFFEF8', borderColor: '#CBBD93AA' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/rules/${rule.id}`} className="font-semibold hover:opacity-70 transition-opacity" style={{ color: '#574A24' }}>
            {rule.name}
          </Link>
          <p className="text-xs mt-0.5 uppercase tracking-wider" style={{ color: '#80775C' }}>{rule.ruleType}</p>
        </div>
        <RuleStateBadge status={rule.status} />
      </div>

      <div
        className="text-xs font-mono rounded-lg p-2.5 border"
        style={{ background: '#FEFCF3', borderColor: '#CBBD9355' }}
      >
        <span style={{ color: '#80775C' }}>IF </span>
        <span style={{ color: '#2E86C1' }}>{rule.inputKey}</span>{' '}
        <span style={{ color: '#B7950B' }}>{rule.predicate.replace(/_/g, ' ')}</span>{' '}
        <span style={{ color: '#1E8449' }}>{String(rule.threshold)}</span>{' '}
        <span style={{ color: '#80775C' }}>→ </span>
        <span style={{ color: '#6C3483' }}>{rule.actionType.replace(/_/g, ' ')}</span>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Link href={`/rules/${rule.id}`} className="text-xs hover:opacity-60 transition-opacity" style={{ color: '#574A24' }}>
          View →
        </Link>
        {!['EXECUTED', 'EXPIRED', 'FAILED', 'CANCELLED'].includes(rule.status) && (
          <button onClick={() => cancelRule(rule.id)} className="text-xs hover:opacity-60 transition-opacity" style={{ color: '#C0392B' }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
