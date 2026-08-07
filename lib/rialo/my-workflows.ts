/**
 * Tracks which on-chain workflows were created by the currently connected
 * wallet, so Dashboard/History can show "my workflows" instead of every
 * workflow anyone has ever created against these programs.
 *
 * Why this is client-side and not queryable on-chain: the workflow state
 * struct (see each program's wit manifest, `workflow_state.structure`)
 * stores recipient/amount/timing/status but has no `payer`/`creator` field.
 * The payer's pubkey is only present in the PDA derivation seeds
 * (`['rialo_workflow', payer_bytes, slug]`), which is one-directional -
 * useful for computing a specific workflow's address if you already know
 * its slug, but not for reverse-searching "all workflows for this payer"
 * via `getAccountsByOwner`, which returns every account the program owns.
 *
 * This mirrors the same client-side-tracking pattern as
 * client-timestamps.ts, and has the same session-scoped tradeoff as the
 * ephemeral wallet itself: tracking is lost if localStorage is cleared,
 * and doesn't span different browsers/devices. That's consistent with how
 * these DevNet-only ephemeral wallets already work, not a step down in
 * rigor from the rest of the app.
 */

const STORAGE_KEY = 'triggerdesk_my_workflows_v1';

function readMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) - non-fatal,
    // the workflow just won't show up under "my workflows" later.
  }
}

export function recordMyWorkflow(payerAddress: string, workflowAddress: string): void {
  const map = readMap();
  const existing = map[payerAddress] ?? [];
  if (!existing.includes(workflowAddress)) {
    map[payerAddress] = [...existing, workflowAddress];
    writeMap(map);
  }
}

export function getMyWorkflowAddresses(payerAddress: string): Set<string> {
  const map = readMap();
  return new Set(map[payerAddress] ?? []);
}
