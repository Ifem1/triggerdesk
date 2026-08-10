import { PublicKey } from '@rialo/ts-cdk';
import { createHash } from 'node:crypto';

const [
  payerAddress,
  programAddress,
  fillByte = '1',
  vaultSeed = 'triggerdesk-vault',
  subscriptionCountValue = '1',
] = process.argv.slice(2);
if (!payerAddress || !programAddress) {
  throw new Error(
    'usage: node scripts/derive-funds-probe.mjs <payer> <program> [slug-fill-byte] [vault-seed]',
  );
}

const fill = Number(fillByte);
if (!Number.isInteger(fill) || fill < 0 || fill > 255) {
  throw new Error('slug-fill-byte must be an integer from 0 through 255');
}
const subscriptionCount = Number(subscriptionCountValue);
if (!Number.isInteger(subscriptionCount) || subscriptionCount < 1 || subscriptionCount > 16) {
  throw new Error('subscription-count must be an integer from 1 through 16');
}

const payer = PublicKey.fromString(payerAddress);
const program = PublicKey.fromString(programAddress);
const slug = new Uint8Array(32).fill(fill);
const [vault, bump] = PublicKey.findProgramAddress(
  [vaultSeed, payer.toBytes(), slug],
  program,
);
const [workflow, workflowBump] = PublicKey.findProgramAddress(
  ['rialo_workflow', payer.toBytes(), slug],
  program,
);
const subscriberProgram = PublicKey.fromString(
  'Subscriber111111111111111111111111111111111',
);
const subscriptions = Array.from({ length: subscriptionCount }, (_, offset) => {
  const branch = Buffer.alloc(8);
  const accountIndex = Buffer.alloc(8);
  accountIndex.writeBigUInt64LE(BigInt(4 + offset));
  const nonce = createHash('sha256')
    .update(workflow.toBytes())
    .update(branch)
    .update(accountIndex)
    .digest();
  const [address, addressBump] = PublicKey.findProgramAddress(
    ['rialo_subscribe', payer.toBytes(), nonce],
    subscriberProgram,
  );
  return {
    accountIndex: 4 + offset,
    address: address.toString(),
    bump: addressBump,
    nonceHex: nonce.toString('hex'),
  };
});

console.log(JSON.stringify({
  slugHex: Buffer.from(slug).toString('hex'),
  workflow: workflow.toString(),
  workflowBump,
  vault: vault.toString(),
  bump,
  vaultSeed,
  subscription: subscriptions[0].address,
  subscriptionBump: subscriptions[0].bump,
  subscriptionNonceHex: subscriptions[0].nonceHex,
  subscriptions,
}));
