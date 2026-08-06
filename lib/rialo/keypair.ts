import { Keypair } from '@rialo/ts-cdk';

const STORAGE_KEY = 'triggerdesk_devnet_keypair_v1';

export function generateEphemeralKeypair(): Keypair {
  return Keypair.generate();
}

export function saveKeypairToSession(keypair: Keypair): void {
  if (typeof window === 'undefined') return;
  const bytes = Array.from(keypair.secretKeyBytes());
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bytes));
}

export function loadKeypairFromSession(): Keypair | null {
  if (typeof window === 'undefined') return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const bytes = new Uint8Array(JSON.parse(stored));
    return Keypair.fromSecretKey(bytes);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearSessionKeypair(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
