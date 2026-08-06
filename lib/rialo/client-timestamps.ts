/**
 * Workaround for a known DevNet limitation: `unix_timestamp()` reads as 0
 * inside Venus programs on Rialo DevNet, so on-chain `created_at` fields
 * always decode to the 1970 epoch. This doesn't affect correctness — AFTER
 * still fires on schedule — but it makes the "Created" timestamp in the UI
 * useless.
 *
 * As a workaround, we capture the real creation time client-side at the
 * moment a workflow is submitted and store it locally, keyed by workflow
 * PDA address. The UI prefers this value whenever the on-chain timestamp
 * is 0.
 *
 * This is a display-only workaround. It does not touch on-chain state and
 * is lost if the browser's localStorage is cleared — that's an acceptable
 * tradeoff for a cosmetic field. See PHASE2-PLAN.md, Step 4.
 */

const STORAGE_KEY = 'triggerdesk_client_created_at_v1';

function readMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable (e.g. private browsing quota) - non-fatal,
    // the on-chain (possibly 1970) timestamp remains the fallback.
  }
}

export function saveClientCreatedAt(workflowAddress: string, whenMs: number = Date.now()): void {
  const map = readMap();
  map[workflowAddress] = whenMs;
  writeMap(map);
}

export function getClientCreatedAt(workflowAddress: string): number | null {
  const map = readMap();
  return map[workflowAddress] ?? null;
}

/**
 * Resolves the best available creation timestamp for display: prefers the
 * on-chain value when it's non-zero (a genuine timestamp), falls back to
 * the locally captured client-side value, and finally to null if neither
 * is available (e.g. a workflow created in a different browser/session).
 */
export function resolveCreatedAt(workflowAddress: string, onChainCreatedAtSeconds: bigint): Date | null {
  if (onChainCreatedAtSeconds > 0n) {
    return new Date(Number(onChainCreatedAtSeconds) * 1000);
  }
  const clientMs = getClientCreatedAt(workflowAddress);
  return clientMs !== null ? new Date(clientMs) : null;
}
