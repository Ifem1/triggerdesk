import { TriggerRule } from '../types/rule';

export function validateRule(rule: Partial<TriggerRule>): string[] {
  const errors: string[] = [];
  if (!rule.name?.trim()) errors.push('Rule name is required');
  if (!rule.ruleType) errors.push('Rule type is required');
  if (!rule.predicate) errors.push('Predicate is required');
  if (rule.threshold === undefined || rule.threshold === '') errors.push('Threshold is required');
  if (!rule.actionType) errors.push('Action is required');
  return errors;
}
