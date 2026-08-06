import { createRialoClient } from '@rialo/ts-cdk';
import type { RialoClient } from '@rialo/ts-cdk';

let clientInstance: RialoClient | null = null;

export function getRialoClient(): RialoClient {
  if (!clientInstance) {
    const rpcUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api/rpc`
      : 'https://devnet.rialo.io:4101';

    clientInstance = createRialoClient({
      chain: { id: 'rialo:devnet', rpcUrl, name: 'devnet' },
    });
  }
  return clientInstance;
}
