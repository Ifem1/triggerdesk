import { evaluatePredicate } from '../lib/simulation/predicate-engine';
import { TriggerRule } from '../lib/types/rule';

function makeRule(overrides: Partial<TriggerRule>): TriggerRule {
  return {
    id: 'test-rule',
    ownerId: 'demo',
    name: 'Test',
    ruleType: 'PRICE',
    inputKey: 'ETH_USD',
    predicate: 'LESS_THAN',
    threshold: 3000,
    actionType: 'REDUCE_EXPOSURE',
    actionParams: {},
    status: 'WAITING',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('evaluatePredicate', () => {
  describe('LESS_THAN', () => {
    it('passes when observed < threshold', () => {
      const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
      const result = evaluatePredicate(rule, { ETH_USD: 2990 });
      expect(result.passed).toBe(true);
      expect(result.observedValue).toBe(2990);
    });

    it('fails when observed >= threshold', () => {
      const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
      const result = evaluatePredicate(rule, { ETH_USD: 3000 });
      expect(result.passed).toBe(false);
    });
  });

  describe('GREATER_THAN', () => {
    it('passes when observed > threshold', () => {
      const rule = makeRule({ predicate: 'GREATER_THAN', threshold: 3000 });
      const result = evaluatePredicate(rule, { ETH_USD: 3100 });
      expect(result.passed).toBe(true);
    });

    it('fails when observed <= threshold', () => {
      const rule = makeRule({ predicate: 'GREATER_THAN', threshold: 3000 });
      const result = evaluatePredicate(rule, { ETH_USD: 2900 });
      expect(result.passed).toBe(false);
    });
  });

  describe('EQUALS', () => {
    it('passes on string match', () => {
      const rule = makeRule({ inputKey: 'DELIVERY_STATUS', predicate: 'EQUALS', threshold: 'confirmed' });
      const result = evaluatePredicate(rule, { DELIVERY_STATUS: 'confirmed' });
      expect(result.passed).toBe(true);
    });

    it('fails on mismatch', () => {
      const rule = makeRule({ inputKey: 'DELIVERY_STATUS', predicate: 'EQUALS', threshold: 'confirmed' });
      const result = evaluatePredicate(rule, { DELIVERY_STATUS: 'pending' });
      expect(result.passed).toBe(false);
    });
  });

  describe('RATIO_BELOW', () => {
    it('passes when ratio < threshold', () => {
      const rule = makeRule({ inputKey: 'COLLATERAL_RATIO', predicate: 'RATIO_BELOW', threshold: 130 });
      const result = evaluatePredicate(rule, { COLLATERAL_RATIO: 128 });
      expect(result.passed).toBe(true);
    });

    it('fails when ratio >= threshold', () => {
      const rule = makeRule({ inputKey: 'COLLATERAL_RATIO', predicate: 'RATIO_BELOW', threshold: 130 });
      const result = evaluatePredicate(rule, { COLLATERAL_RATIO: 135 });
      expect(result.passed).toBe(false);
    });
  });

  describe('DATE_REACHED', () => {
    it('passes when threshold date is in the past', () => {
      const pastDate = new Date(Date.now() - 60000).toISOString();
      const rule = makeRule({ inputKey: 'INVOICE_DUE_DATE', predicate: 'DATE_REACHED', threshold: pastDate });
      const result = evaluatePredicate(rule, { INVOICE_DUE_DATE: pastDate });
      expect(result.passed).toBe(true);
    });

    it('fails when threshold date is in the future', () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();
      const rule = makeRule({ inputKey: 'INVOICE_DUE_DATE', predicate: 'DATE_REACHED', threshold: futureDate });
      const result = evaluatePredicate(rule, { INVOICE_DUE_DATE: futureDate });
      expect(result.passed).toBe(false);
    });
  });

  it('returns reason string for every result', () => {
    const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
    const result = evaluatePredicate(rule, { ETH_USD: 2990 });
    expect(typeof result.reason).toBe('string');
    expect(result.reason.length).toBeGreaterThan(0);
  });

  it('returns evaluatedAt timestamp', () => {
    const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
    const result = evaluatePredicate(rule, { ETH_USD: 2990 });
    expect(result.evaluatedAt).toBeTruthy();
    expect(() => new Date(result.evaluatedAt)).not.toThrow();
  });

  it('fails gracefully when feed key is missing', () => {
    const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
    const result = evaluatePredicate(rule, {});
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('No feed data');
  });

  it('is deterministic — same inputs always produce same result', () => {
    const rule = makeRule({ predicate: 'LESS_THAN', threshold: 3000 });
    const feedState = { ETH_USD: 2990 };
    const r1 = evaluatePredicate(rule, feedState, '2026-06-27T12:00:00.000Z');
    const r2 = evaluatePredicate(rule, feedState, '2026-06-27T12:00:00.000Z');
    expect(r1.passed).toBe(r2.passed);
    expect(r1.reason).toBe(r2.reason);
  });
});
