'use client';

import { TriggerRule } from '../types/rule';
import { ExecutionReceipt } from '../types/execution';
import { SimulatedAppState } from '../types/state';
import { seedRules, seedAppState } from '../simulation/seed-demo-data';

const KEYS = {
  rules: 'td_rules',
  receipts: 'td_receipts',
  appState: 'td_app_state',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localStore = {
  getRules(): TriggerRule[] {
    return get<TriggerRule[]>(KEYS.rules, []);
  },
  setRules(rules: TriggerRule[]): void {
    set(KEYS.rules, rules);
  },
  upsertRule(rule: TriggerRule): void {
    const rules = this.getRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) rules[idx] = rule;
    else rules.push(rule);
    this.setRules(rules);
  },
  deleteRule(id: string): void {
    this.setRules(this.getRules().filter((r) => r.id !== id));
  },

  getReceipts(): ExecutionReceipt[] {
    return get<ExecutionReceipt[]>(KEYS.receipts, []);
  },
  addReceipt(receipt: ExecutionReceipt): void {
    const receipts = this.getReceipts();
    receipts.unshift(receipt);
    set(KEYS.receipts, receipts);
  },

  getAppState(): SimulatedAppState {
    return get<SimulatedAppState>(KEYS.appState, seedAppState());
  },
  setAppState(state: SimulatedAppState): void {
    set(KEYS.appState, state);
  },

  seedIfEmpty(): void {
    if (this.getRules().length === 0) {
      this.setRules(seedRules());
    }
    if (!localStorage.getItem(KEYS.appState)) {
      this.setAppState(seedAppState());
    }
  },

  resetAll(): void {
    this.setRules(seedRules());
    set(KEYS.receipts, []);
    this.setAppState(seedAppState());
  },
};
