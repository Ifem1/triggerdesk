import { PublicKey } from '@rialo/ts-cdk';

const [payerAddress, programAddress, fillByte = '1'] = process.argv.slice(2);
if (!payerAddress || !programAddress) {
  throw new Error('usage: node scripts/derive-funds-probe.mjs <payer> <program> [slug-fill-byte]');
}

const fill = Number(fillByte);
if (!Number.isInteger(fill) || fill < 0 || fill > 255) {
  throw new Error('slug-fill-byte must be an integer from 0 through 255');
}

const payer = PublicKey.fromString(payerAddress);
const program = PublicKey.fromString(programAddress);
const slug = new Uint8Array(32).fill(fill);
const [vault, bump] = PublicKey.findProgramAddress(
  ['triggerdesk-vault', payer.toBytes(), slug],
  program,
);

console.log(JSON.stringify({
  slugHex: Buffer.from(slug).toString('hex'),
  vault: vault.toString(),
  bump,
}));
