import { TriggerRule, RuleStatus } from '../types/rule';

type Transition =
  | 'ACTIVATE'
  | 'PREDICATE_PASSED'
  | 'PREDICATE_FAILED'
  | 'REPLAY_ACCEPT'
  | 'ACTION_SUCCESS'
  | 'ACTION_FAILURE'
  | 'EXPIRE'
  | 'CANCEL';

const transitions: Record<RuleStatus, Partial<Record<Transition, RuleStatus>>> = {
  DRAFT: { ACTIVATE: 'WAITING' },
  WAITING: {
    PREDICATE_PASSED: 'ELIGIBLE',
    EXPIRE: 'EXPIRED',
    CANCEL: 'CANCELLED',
  },
  ELIGIBLE: {
    REPLAY_ACCEPT: 'TRIGGERED',
    PREDICATE_FAILED: 'WAITING',
    CANCEL: 'CANCELLED',
  },
  TRIGGERED: {
    ACTION_SUCCESS: 'EXECUTED',
    ACTION_FAILURE: 'FAILED',
  },
  EXECUTED: {},
  EXPIRED: {},
  CANCELLED: {},
  FAILED: {},
};

export function transition(rule: TriggerRule, event: Transition): TriggerRule {
  const next = transitions[rule.status]?.[event];
  if (!next) return rule;
  return { ...rule, status: next };
}

export function canTransition(status: RuleStatus, event: Transition): boolean {
  return !!transitions[status]?.[event];
}

export const TERMINAL_STATES: RuleStatus[] = ['EXECUTED', 'EXPIRED', 'CANCELLED', 'FAILED'];

export function isTerminal(status: RuleStatus): boolean {
  return TERMINAL_STATES.includes(status);
}
