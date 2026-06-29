import { transition, canTransition, isTerminal, TERMINAL_STATES } from '../lib/simulation/state-machine';
import { TriggerRule } from '../lib/types/rule';

function makeRule(status: TriggerRule['status']): TriggerRule {
  return {
    id: 'r1',
    ownerId: 'demo',
    name: 'Test',
    ruleType: 'PRICE',
    inputKey: 'ETH_USD',
    predicate: 'LESS_THAN',
    threshold: 3000,
    actionType: 'REDUCE_EXPOSURE',
    actionParams: {},
    status,
    createdAt: new Date().toISOString(),
  };
}

describe('state-machine', () => {
  it('DRAFT -> WAITING on ACTIVATE', () => {
    const rule = makeRule('DRAFT');
    expect(transition(rule, 'ACTIVATE').status).toBe('WAITING');
  });

  it('WAITING -> ELIGIBLE on PREDICATE_PASSED', () => {
    const rule = makeRule('WAITING');
    expect(transition(rule, 'PREDICATE_PASSED').status).toBe('ELIGIBLE');
  });

  it('WAITING -> EXPIRED on EXPIRE', () => {
    const rule = makeRule('WAITING');
    expect(transition(rule, 'EXPIRE').status).toBe('EXPIRED');
  });

  it('WAITING -> CANCELLED on CANCEL', () => {
    const rule = makeRule('WAITING');
    expect(transition(rule, 'CANCEL').status).toBe('CANCELLED');
  });

  it('ELIGIBLE -> TRIGGERED on REPLAY_ACCEPT', () => {
    const rule = makeRule('ELIGIBLE');
    expect(transition(rule, 'REPLAY_ACCEPT').status).toBe('TRIGGERED');
  });

  it('ELIGIBLE -> WAITING on PREDICATE_FAILED', () => {
    const rule = makeRule('ELIGIBLE');
    expect(transition(rule, 'PREDICATE_FAILED').status).toBe('WAITING');
  });

  it('TRIGGERED -> EXECUTED on ACTION_SUCCESS', () => {
    const rule = makeRule('TRIGGERED');
    expect(transition(rule, 'ACTION_SUCCESS').status).toBe('EXECUTED');
  });

  it('TRIGGERED -> FAILED on ACTION_FAILURE', () => {
    const rule = makeRule('TRIGGERED');
    expect(transition(rule, 'ACTION_FAILURE').status).toBe('FAILED');
  });

  it('does not mutate rule — returns new object', () => {
    const rule = makeRule('WAITING');
    const next = transition(rule, 'PREDICATE_PASSED');
    expect(rule.status).toBe('WAITING');
    expect(next.status).toBe('ELIGIBLE');
    expect(next).not.toBe(rule);
  });

  it('returns same rule when transition is invalid', () => {
    const rule = makeRule('EXECUTED');
    const next = transition(rule, 'ACTIVATE');
    expect(next.status).toBe('EXECUTED');
  });

  it('full happy path: DRAFT → EXECUTED', () => {
    let rule = makeRule('DRAFT');
    rule = transition(rule, 'ACTIVATE');
    expect(rule.status).toBe('WAITING');
    rule = transition(rule, 'PREDICATE_PASSED');
    expect(rule.status).toBe('ELIGIBLE');
    rule = transition(rule, 'REPLAY_ACCEPT');
    expect(rule.status).toBe('TRIGGERED');
    rule = transition(rule, 'ACTION_SUCCESS');
    expect(rule.status).toBe('EXECUTED');
  });

  describe('isTerminal', () => {
    it('marks EXECUTED as terminal', () => expect(isTerminal('EXECUTED')).toBe(true));
    it('marks EXPIRED as terminal', () => expect(isTerminal('EXPIRED')).toBe(true));
    it('marks CANCELLED as terminal', () => expect(isTerminal('CANCELLED')).toBe(true));
    it('marks FAILED as terminal', () => expect(isTerminal('FAILED')).toBe(true));
    it('marks WAITING as non-terminal', () => expect(isTerminal('WAITING')).toBe(false));
    it('marks ELIGIBLE as non-terminal', () => expect(isTerminal('ELIGIBLE')).toBe(false));
  });

  describe('canTransition', () => {
    it('returns true for valid transitions', () => {
      expect(canTransition('WAITING', 'PREDICATE_PASSED')).toBe(true);
    });
    it('returns false for invalid transitions', () => {
      expect(canTransition('EXECUTED', 'ACTIVATE')).toBe(false);
    });
  });
});
