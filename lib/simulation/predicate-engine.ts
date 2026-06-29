import { TriggerRule } from '../types/rule';
import { PredicateResult } from '../types/execution';
import { FeedState } from '../types/feed';

export function evaluatePredicate(
  rule: TriggerRule,
  feedState: FeedState,
  nowIso?: string
): PredicateResult {
  const evaluatedAt = nowIso ?? new Date().toISOString();
  const raw = feedState[rule.inputKey];
  const observedValue = raw !== undefined ? raw : 'N/A';
  const threshold = rule.threshold;

  if (raw === undefined || raw === 'N/A') {
    return {
      ruleId: rule.id,
      passed: false,
      reason: `No feed data for key "${rule.inputKey}"`,
      observedValue,
      threshold,
      evaluatedAt,
    };
  }

  switch (rule.predicate) {
    case 'LESS_THAN': {
      const passed = Number(raw) < Number(threshold);
      return {
        ruleId: rule.id,
        passed,
        reason: passed
          ? `${rule.inputKey} ${raw} is less than threshold ${threshold}`
          : `${rule.inputKey} ${raw} is not less than threshold ${threshold}`,
        observedValue,
        threshold,
        evaluatedAt,
      };
    }
    case 'GREATER_THAN': {
      const passed = Number(raw) > Number(threshold);
      return {
        ruleId: rule.id,
        passed,
        reason: passed
          ? `${rule.inputKey} ${raw} is greater than threshold ${threshold}`
          : `${rule.inputKey} ${raw} is not greater than threshold ${threshold}`,
        observedValue,
        threshold,
        evaluatedAt,
      };
    }
    case 'EQUALS': {
      const passed = String(raw) === String(threshold);
      return {
        ruleId: rule.id,
        passed,
        reason: passed
          ? `${rule.inputKey} equals "${threshold}"`
          : `${rule.inputKey} "${raw}" does not equal "${threshold}"`,
        observedValue,
        threshold,
        evaluatedAt,
      };
    }
    case 'DATE_REACHED': {
      const now = nowIso ? new Date(nowIso) : new Date();
      const due = new Date(String(threshold));
      const passed = now >= due;
      return {
        ruleId: rule.id,
        passed,
        reason: passed
          ? `Due date ${threshold} has been reached`
          : `Due date ${threshold} has not been reached yet`,
        observedValue: now.toISOString(),
        threshold,
        evaluatedAt,
      };
    }
    case 'RATIO_BELOW': {
      const passed = Number(raw) < Number(threshold);
      return {
        ruleId: rule.id,
        passed,
        reason: passed
          ? `Ratio ${raw}% is below threshold ${threshold}%`
          : `Ratio ${raw}% is above threshold ${threshold}%`,
        observedValue,
        threshold,
        evaluatedAt,
      };
    }
    default:
      return {
        ruleId: rule.id,
        passed: false,
        reason: `Unknown predicate: ${rule.predicate}`,
        observedValue,
        threshold,
        evaluatedAt,
      };
  }
}
