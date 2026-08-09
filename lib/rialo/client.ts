import { createRialoClient } from '@rialo/ts-cdk';
import type { RialoClient } from '@rialo/ts-cdk';
import { ACTIVE_NETWORK } from './network';

let clientInstance: RialoClient | null = null;

export function getRialoClient(): RialoClient {
  if (!clientInstance) {
    const rpcUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/api/rpc`
      : ACTIVE_NETWORK.rpcUrl;

    clientInstance = createRialoClient({
      chain: { id: ACTIVE_NETWORK.chainId, rpcUrl, name: ACTIVE_NETWORK.name },
    });
  }
  return clientInstance;
}
