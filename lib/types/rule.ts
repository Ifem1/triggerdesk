export type RuleStatus =
  | 'DRAFT'
  | 'WAITING'
  | 'ELIGIBLE'
  | 'TRIGGERED'
  | 'EXECUTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'FAILED';

export type Predicate =
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'EQUALS'
  | 'DATE_REACHED'
  | 'RATIO_BELOW';

export type ActionType =
  | 'REDUCE_EXPOSURE'
  | 'MARK_INVOICE_PAYABLE'
  | 'TRIGGER_WARNING'
  | 'UNLOCK_ESCROW'
  | 'EMIT_ALERT';

export type RuleType = 'PRICE' | 'TIME' | 'INVOICE' | 'COLLATERAL' | 'ESCROW';

export interface TriggerRule {
  id: string;
  ownerId: string;
  name: string;
  ruleType: RuleType;
  inputKey: string;
  predicate: Predicate;
  threshold: number | string;
  actionType: ActionType;
  actionParams: Record<string, unknown>;
  status: RuleStatus;
  createdAt: string;
  expiresAt?: string;
  simulatedSignature?: string;
}
