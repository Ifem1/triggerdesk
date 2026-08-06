import {
  PublicKey,
  TransactionBuilder,
  type Keypair,
  type RialoClient,
  type Instruction,
  KELVIN_PER_RLO,
} from '@rialo/ts-cdk';
import { RECURRING_ALLOWANCE_PROGRAM_ID, ALLOWANCE_STATUS } from './constants';
import type { RecurringAllowanceState, CreateRecurringAllowanceParams } from './types';

const PROGRAM_ID = PublicKey.fromString(RECURRING_ALLOWANCE_PROGRAM_ID);
const SYSTEM_PROGRAM = PublicKey.fromString('11111111111111111111111111111111');
const SUBSCRIBER_INTERFACE = PublicKey.fromString('Subscriber111111111111111111111111111111111');

function generateRandomSlug(): Uint8Array {
  const slug = new Uint8Array(32);
  crypto.getRandomValues(slug);
  return slug;
}

async function multiAccountSlug(
  workflowPda: PublicKey,
  branchNumber: number,
  index: number,
): Promise<Uint8Array> {
  const data = new Uint8Array(32 + 8 + 8);
  data.set(workflowPda.toBytes(), 0);
  const view = new DataView(data.buffer);
  view.setBigUint64(32, BigInt(branchNumber), true);
  view.setBigUint64(40, BigInt(index), true);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

function deriveWorkflowPda(
  payerPubkey: PublicKey,
  slug: Uint8Array,
): readonly [PublicKey, number] {
  return PublicKey.findProgramAddress(
    ['rialo_workflow', payerPubkey.toBytes(), slug],
    PROGRAM_ID,
  );
}

async function deriveSubscriptionPda(
  payerPubkey: PublicKey,
  workflowPda: PublicKey,
  index: number,
): Promise<readonly [PublicKey, number]> {
  const slug = await multiAccountSlug(workflowPda, 0, index);
  return PublicKey.findProgramAddress(
    ['rialo_subscribe', payerPubkey.toBytes(), slug],
    SUBSCRIBER_INTERFACE,
  );
}

function buildSetupInstructionData(
  slug: Uint8Array,
  recipientPubkey: PublicKey,
  amountKelvin: bigint,
  intervalSeconds: bigint,
): Uint8Array {
  // bincode enum variant 2 (u32 LE) + slug (32) + recipient (32) + amount (u64 LE) + interval (u64 LE)
  const data = new Uint8Array(4 + 32 + 32 + 8 + 8);
  const view = new DataView(data.buffer);

  view.setUint32(0, 2, true);
  data.set(slug, 4);
  data.set(recipientPubkey.toBytes(), 36);
  view.setBigUint64(68, amountKelvin, true);
  view.setBigUint64(76, intervalSeconds, true);

  return data;
}

export async function createRecurringAllowance(
  client: RialoClient,
  payer: Keypair,
  params: CreateRecurringAllowanceParams,
): Promise<{ signature: string; workflowPda: string; slug: Uint8Array }> {
  const recipientPubkey = PublicKey.fromString(params.recipientAddress);
  const amountKelvin = BigInt(Math.round(params.amountRlo * KELVIN_PER_RLO));
  const intervalSeconds = BigInt(params.intervalSeconds);

  const slug = generateRandomSlug();
  const [workflowPda] = deriveWorkflowPda(payer.publicKey, slug);
  const [subPda0] = await deriveSubscriptionPda(payer.publicKey, workflowPda, 4);
  const [subPda1] = await deriveSubscriptionPda(payer.publicKey, workflowPda, 5);
  const [subPda2] = await deriveSubscriptionPda(payer.publicKey, workflowPda, 6);

  const instructionData = buildSetupInstructionData(slug, recipientPubkey, amountKelvin, intervalSeconds);

  const instruction: Instruction = {
    programId: PROGRAM_ID,
    accounts: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: workflowPda, isSigner: false, isWritable: true },
      { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: SUBSCRIBER_INTERFACE, isSigner: false, isWritable: false },
      { pubkey: subPda0, isSigner: false, isWritable: true },
      { pubkey: subPda1, isSigner: false, isWritable: true },
      { pubkey: subPda2, isSigner: false, isWritable: true },
    ],
    data: instructionData,
  };

  const configHashPrefix = await client.getConfigHashPrefix();

  const tx = TransactionBuilder.create()
    .setPayer(payer.publicKey)
    .setValidFrom(BigInt(Date.now()))
    .setConfigHashPrefix(configHashPrefix)
    .addInstruction(instruction)
    .build();

  const signedTx = tx.sign(payer);
  const result = await client.sendAndConfirmTransaction(signedTx.serialize());

  if (!result.executed) {
    throw new Error(
      `Transaction failed on-chain: ${JSON.stringify(result.err ?? 'unknown error')}`,
    );
  }

  return {
    signature: result.signature.toString(),
    workflowPda: workflowPda.toString(),
    slug,
  };
}

export function decodeAllowanceState(data: Uint8Array): RecurringAllowanceState {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const discriminator = view.getBigUint64(0, true);
  const recipientBytes = data.slice(8, 40);
  const recipient = PublicKey.fromBytes(recipientBytes).toString();
  const amountKelvin = view.getBigUint64(40, true);
  const intervalSeconds = view.getBigUint64(48, true);
  const totalDistributed = view.getBigUint64(56, true);
  const distributionCount = view.getBigUint64(64, true);
  const createdAt = view.getBigUint64(72, true);
  const status = data[80];

  return {
    discriminator,
    recipient,
    amountKelvin,
    intervalSeconds,
    totalDistributed,
    distributionCount,
    createdAt,
    status,
  };
}

export async function getAllowanceState(
  client: RialoClient,
  pdaAddress: string,
): Promise<RecurringAllowanceState | null> {
  try {
    const info = await client.getAccountInfo(PublicKey.fromString(pdaAddress));
    if (!info || !info.data || !info.data[0]) return null;

    const raw = info.data[0];
    let bytes: Uint8Array;
    if (info.data[1] === 'base64') {
      bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    } else {
      bytes = new TextEncoder().encode(raw);
    }

    return decodeAllowanceState(bytes);
  } catch {
    return null;
  }
}

export async function listAllowanceWorkflows(
  client: RialoClient,
): Promise<Array<{ address: string; state: RecurringAllowanceState }>> {
  try {
    const [accounts] = await client.getAccountsByOwner(PROGRAM_ID, undefined, undefined);
    const workflows: Array<{ address: string; state: RecurringAllowanceState }> = [];

    for (const entry of accounts) {
      try {
        const acctData = entry.account.data;
        let bytes: Uint8Array;
        if (acctData && acctData[0]) {
          const raw = acctData[0];
          if (acctData[1] === 'base64') {
            bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
          } else {
            bytes = new TextEncoder().encode(raw);
          }
        } else {
          continue;
        }

        if (bytes.length < 81) continue;
        const state = decodeAllowanceState(bytes);
        if (state.discriminator === 0n) continue;

        workflows.push({ address: entry.pubkey.toString(), state });
      } catch {
        continue;
      }
    }

    return workflows;
  } catch {
    return [];
  }
}

export function getAllowanceStatusLabel(status: number): string {
  switch (status) {
    case ALLOWANCE_STATUS.UNINITIALIZED: return 'Uninitialized';
    case ALLOWANCE_STATUS.ACTIVE: return 'Active';
    case ALLOWANCE_STATUS.COMPLETE: return 'Complete';
    case ALLOWANCE_STATUS.CANCELLED: return 'Cancelled';
    default: return `Unknown (${status})`;
  }
}
