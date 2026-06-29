import { RuleStatus } from '@/lib/types/rule';

const STYLES: Record<RuleStatus, { bg: string; text: string; border: string }> = {
  DRAFT:     { bg: '#F5F0E8', text: '#80775C', border: '#CBBD93' },
  WAITING:   { bg: '#EBF5FB', text: '#2E86C1', border: '#AED6F1' },
  ELIGIBLE:  { bg: '#FEF9E7', text: '#B7950B', border: '#F9E79F' },
  TRIGGERED: { bg: '#FEF5E7', text: '#CA6F1E', border: '#FAD7A0' },
  EXECUTED:  { bg: '#EAFAF1', text: '#1E8449', border: '#A9DFBF' },
  EXPIRED:   { bg: '#F2F3F4', text: '#808B96', border: '#CCD1D1' },
  CANCELLED: { bg: '#F2F3F4', text: '#808B96', border: '#CCD1D1' },
  FAILED:    { bg: '#FDEDEC', text: '#C0392B', border: '#F5B7B1' },
};

export default function RuleStateBadge({ status }: { status: RuleStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-lg font-mono uppercase tracking-widest border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {status}
    </span>
  );
}
