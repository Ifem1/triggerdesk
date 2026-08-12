import {
  PublicKey,
  RIALO_DEVNET_CHAIN,
  createRialoClient,
} from '@rialo/ts-cdk';

const [address, limitValue = '20'] = process.argv.slice(2);
if (!address) {
  throw new Error('usage: node scripts/query-rialo-signatures.mjs <address> [limit] [rpc-url]');
}

const limit = Number(limitValue);
if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
  throw new Error('limit must be an integer from 1 through 1000');
}

const client = createRialoClient({ chain: RIALO_DEVNET_CHAIN });
const result = await client.getSignaturesForAddress(PublicKey.fromString(address), { limit });
console.log(JSON.stringify(result, (_, value) => (
  typeof value === 'bigint' ? value.toString() : value
)));
