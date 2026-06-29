import { ActionType, Predicate, RuleStatus } from './rule';

export interface PredicateResult {
  ruleId: string;
  passed: boolean;
  reason: string;
  observedValue: number | string;
  threshold: number | string;
  evaluatedAt: string;
}

export interface ExecutionReceipt {
  id: string;
  ruleId: string;
  ruleName: string;
  observedValue: number | string;
  threshold: number | string;
  predicate: Predicate;
  action: ActionType;
  status: RuleStatus;
  reason: string;
  timestamp: string;
  actionParams: Record<string, unknown>;
}
