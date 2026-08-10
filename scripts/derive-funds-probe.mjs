import { PublicKey } from '@rialo/ts-cdk';
import { createHash } from 'node:crypto';

const [
  payerAddress,
  programAddress,
  fillByte = '1',
  vaultSeed = 'triggerdesk-vault',
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
const branch = Buffer.alloc(8);
const subscriptionAccountIndex = Buffer.alloc(8);
subscriptionAccountIndex.writeBigUInt64LE(4n);
const subscriptionNonce = createHash('sha256')
  .update(workflow.toBytes())
  .update(branch)
  .update(subscriptionAccountIndex)
  .digest();
const [subscription, subscriptionBump] = PublicKey.findProgramAddress(
  ['rialo_subscribe', payer.toBytes(), subscriptionNonce],
  PublicKey.fromString('Subscriber111111111111111111111111111111111'),
);

console.log(JSON.stringify({
  slugHex: Buffer.from(slug).toString('hex'),
  workflow: workflow.toString(),
  workflowBump,
  vault: vault.toString(),
  bump,
  vaultSeed,
  subscription: subscription.toString(),
  subscriptionBump,
  subscriptionNonceHex: subscriptionNonce.toString('hex'),
}));
