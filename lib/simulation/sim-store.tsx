'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { TriggerRule } from '../types/rule';
import { ExecutionReceipt, PredicateResult } from '../types/execution';
import { SimulatedAppState } from '../types/state';
import { FeedEvent, FeedState, ReplayFile } from '../types/feed';
import { localStore } from '../storage/local-store';
import { evaluatePredicate } from './predicate-engine';
import { transition, isTerminal } from './state-machine';
import { simulateAction } from './action-simulator';
import { generateId } from '../utils/ids';

interface SimStore {
  rules: TriggerRule[];
  receipts: ExecutionReceipt[];
  appState: SimulatedAppState;
  feedState: FeedState;
  replayFile: ReplayFile | null;
  replayIndex: number;
  replayRunning: boolean;
  replaySpeed: number;
  lastResults: PredicateResult[];

  addRule(rule: TriggerRule): void;
  updateRule(rule: TriggerRule): void;
  deleteRule(id: string): void;
  activateRule(id: string): void;
  cancelRule(id: string): void;

  loadReplay(file: ReplayFile): void;
  startReplay(): void;
  pauseReplay(): void;
  resetReplay(): void;
  stepReplay(): void;
  setReplaySpeed(s: number): void;

  resetAll(): void;
}

const Ctx = createContext<SimStore | null>(null);

export function SimProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [receipts, setReceipts] = useState<ExecutionReceipt[]>([]);
  const [appState, setAppState] = useState<SimulatedAppState | null>(null);
  const [feedState, setFeedState] = useState<FeedState>({});
  const [replayFile, setReplayFile] = useState<ReplayFile | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayRunning, setReplayRunning] = useState(false);
  const [replaySpeed, setReplaySpeedState] = useState(1);
  const [lastResults, setLastResults] = useState<PredicateResult[]>([]);

  const replayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef({ rules, appState, replayIndex, replayFile, receipts });

  useEffect(() => {
    stateRef.current = { rules, appState, replayIndex, replayFile, receipts };
  });

  useEffect(() => {
    localStore.seedIfEmpty();
    setRules(localStore.getRules());
    setReceipts(localStore.getReceipts());
    setAppState(localStore.getAppState());
  }, []);

  const processFeeds = useCallback((newFeed: FeedState, currentRules: TriggerRule[], currentAppState: SimulatedAppState, currentReceipts: ExecutionReceipt[]) => {
    const updatedRules: TriggerRule[] = [];
    const newReceipts: ExecutionReceipt[] = [];
    const results: PredicateResult[] = [];
    let newAppState = currentAppState;

    for (const rule of currentRules) {
      if (isTerminal(rule.status) || rule.status === 'DRAFT') {
        updatedRules.push(rule);
        continue;
      }

      const result = evaluatePredicate(rule, newFeed);
      results.push(result);

      if (result.passed && rule.status === 'WAITING') {
        const eligible = transition(rule, 'PREDICATE_PASSED');
        const triggered = transition(eligible, 'REPLAY_ACCEPT');
        const { newState, result: actionResult } = simulateAction(triggered, newAppState);
        newAppState = newState;
        const executed = transition(triggered, actionResult.success ? 'ACTION_SUCCESS' : 'ACTION_FAILURE');
        updatedRules.push(executed);

        const receipt: ExecutionReceipt = {
          id: generateId('rcpt'),
          ruleId: rule.id,
          ruleName: rule.name,
          observedValue: result.observedValue,
          threshold: result.threshold,
          predicate: rule.predicate,
          action: rule.actionType,
          status: executed.status,
          reason: result.reason,
          timestamp: new Date().toISOString(),
          actionParams: rule.actionParams,
        };
        newReceipts.push(receipt);
      } else if (!result.passed && rule.status === 'ELIGIBLE') {
        updatedRules.push(transition(rule, 'PREDICATE_FAILED'));
      } else {
        updatedRules.push(rule);
      }
    }

    setLastResults(results);
    setRules(updatedRules);
    localStore.setRules(updatedRules);

    if (newAppState !== currentAppState) {
      setAppState(newAppState);
      localStore.setAppState(newAppState);
    }

    if (newReceipts.length > 0) {
      const allReceipts = [...newReceipts, ...currentReceipts];
      setReceipts(allReceipts);
      newReceipts.forEach((r) => localStore.addReceipt(r));
    }
  }, []);

  const stepOnce = useCallback(() => {
    const { replayFile, replayIndex, rules, appState, receipts } = stateRef.current;
    if (!replayFile || !appState) return;
    if (replayIndex >= replayFile.events.length) {
      setReplayRunning(false);
      if (replayRef.current) clearInterval(replayRef.current);
      return;
    }
    const event: FeedEvent = replayFile.events[replayIndex];
    const newFeed: FeedState = { [event.feed]: event.value };
    setFeedState((prev) => ({ ...prev, ...newFeed }));
    setReplayIndex((i) => i + 1);
    processFeeds(newFeed, rules, appState, receipts);
  }, [processFeeds]);

  useEffect(() => {
    if (replayRunning) {
      replayRef.current = setInterval(stepOnce, 1500 / replaySpeed);
    } else {
      if (replayRef.current) clearInterval(replayRef.current);
    }
    return () => { if (replayRef.current) clearInterval(replayRef.current); };
  }, [replayRunning, replaySpeed, stepOnce]);

  const store: SimStore = {
    rules,
    receipts,
    appState: appState ?? localStore.getAppState(),
    feedState,
    replayFile,
    replayIndex,
    replayRunning,
    replaySpeed,
    lastResults,

    addRule(rule) {
      const r = { ...rule, status: 'WAITING' as const };
      setRules((prev) => { const next = [...prev, r]; localStore.setRules(next); return next; });
    },
    updateRule(rule) {
      setRules((prev) => { const next = prev.map((r) => r.id === rule.id ? rule : r); localStore.setRules(next); return next; });
    },
    deleteRule(id) {
      setRules((prev) => { const next = prev.filter((r) => r.id !== id); localStore.setRules(next); return next; });
    },
    activateRule(id) {
      setRules((prev) => {
        const next = prev.map((r) => r.id === id ? transition(r, 'ACTIVATE') : r);
        localStore.setRules(next);
        return next;
      });
    },
    cancelRule(id) {
      setRules((prev) => {
        const next = prev.map((r) => r.id === id ? transition(r, 'CANCEL') : r);
        localStore.setRules(next);
        return next;
      });
    },

    loadReplay(file) {
      setReplayFile(file);
      setReplayIndex(0);
      setReplayRunning(false);
      setFeedState({});
    },
    startReplay() { setReplayRunning(true); },
    pauseReplay() { setReplayRunning(false); },
    resetReplay() {
      setReplayRunning(false);
      setReplayIndex(0);
      setFeedState({});
    },
    stepReplay() { stepOnce(); },
    setReplaySpeed(s) { setReplaySpeedState(s); },

    resetAll() {
      localStore.resetAll();
      setRules(localStore.getRules());
      setReceipts([]);
      setAppState(localStore.getAppState());
      setFeedState({});
      setReplayFile(null);
      setReplayIndex(0);
      setReplayRunning(false);
      setLastResults([]);
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useSim(): SimStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSim must be used within SimProvider');
  return ctx;
}
