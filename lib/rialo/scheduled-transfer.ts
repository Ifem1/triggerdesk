import {
  PublicKey,
  TransactionBuilder,
  type Keypair,
  type RialoClient,
  type Instruction,
  KELVIN_PER_RLO,
} from '@rialo/ts-cdk';
import { SCHEDULED_TRANSFER_PROGRAM_ID, WORKFLOW_STATUS } from './constants';
import type { ScheduledTransferState, CreateScheduledTransferParams } from './types';

const PROGRAM_ID = PublicKey.fromString(SCHEDULED_TRANSFER_PROGRAM_ID);
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
): [PublicKey, number] {
  return PublicKey.findProgramAddress(
    ['rialo_workflow', payerPubkey.toBytes(), slug],
    PROGRAM_ID,
  );
}

async function deriveSubscriptionPda(
  payerPubkey: PublicKey,
  workflowPda: PublicKey,
): Promise<[PublicKey, number]> {
  const slug = await multiAccountSlug(workflowPda, 0, 4);
  return PublicKey.findProgramAddress(
    ['rialo_subscribe', payerPubkey.toBytes(), slug],
    SUBSCRIBER_INTERFACE,
  );
}

function buildScheduleInstructionData(
  slug: Uint8Array,
  recipientPubkey: PublicKey,
  amountKelvin: bigint,
  executeAt: bigint,
): Uint8Array {
  // bincode enum variant 2 (u32 LE) + slug (32) + recipient (32) + amount (u64 LE) + execute_at (u64 LE)
  const data = new Uint8Array(4 + 32 + 32 + 8 + 8);
  const view = new DataView(data.buffer);

  view.setUint32(0, 2, true); // enum variant 2 = schedule
  data.set(slug, 4);
  data.set(recipientPubkey.toBytes(), 36);
  view.setBigUint64(68, amountKelvin, true);
  view.setBigUint64(76, executeAt, true);

  return data;
}

export async function createScheduledTransfer(
  client: RialoClient,
  payer: Keypair,
  params: CreateScheduledTransferParams,
): Promise<{ signature: string; workflowPda: string; slug: Uint8Array }> {
  const recipientPubkey = PublicKey.fromString(params.recipientAddress);
  const amountKelvin = BigInt(Math.round(params.amountRlo * KELVIN_PER_RLO));
  const executeAt = BigInt(Math.floor(Date.now() / 1000) + params.delaySeconds);

  const slug = generateRandomSlug();
  const [workflowPda] = deriveWorkflowPda(payer.publicKey, slug);
  const [subscriptionPda] = await deriveSubscriptionPda(payer.publicKey, workflowPda);

  const instructionData = buildScheduleInstructionData(slug, recipientPubkey, amountKelvin, executeAt);

  const instruction: Instruction = {
    programId: PROGRAM_ID,
    accounts: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: workflowPda, isSigner: false, isWritable: true },
      { pubkey: SYSTEM_PROGRAM, isSigner: false, isWritable: false },
      { pubkey: SUBSCRIBER_INTERFACE, isSigner: false, isWritable: false },
      { pubkey: subscriptionPda, isSigner: false, isWritable: true },
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

export function decodeWorkflowState(data: Uint8Array): ScheduledTransferState {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  const discriminator = view.getBigUint64(0, true);
  const recipientBytes = data.slice(8, 40);
  const recipient = new PublicKey(recipientBytes).toString();
  const amountKelvin = view.getBigUint64(40, true);
  const scheduledAt = view.getBigUint64(48, true);
  const createdAt = view.getBigUint64(56, true);
  const status = data[64];

  return { discriminator, recipient, amountKelvin, scheduledAt, createdAt, status };
}

export async function getWorkflowState(
  client: RialoClient,
  pdaAddress: string,
): Promise<ScheduledTransferState | null> {
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

    return decodeWorkflowState(bytes);
  } catch {
    return null;
  }
}

export async function listWorkflows(
  client: RialoClient,
  payerPubkey?: PublicKey,
): Promise<Array<{ address: string; state: ScheduledTransferState }>> {
  try {
    const [accounts] = await client.getAccountsByOwner(PROGRAM_ID);
    const workflows: Array<{ address: string; state: ScheduledTransferState }> = [];

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

        if (bytes.length < 65) continue;
        const state = decodeWorkflowState(bytes);
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

export function formatKelvinAsRlo(kelvin: bigint): string {
  const rlo = Number(kelvin) / KELVIN_PER_RLO;
  return rlo.toFixed(rlo % 1 === 0 ? 0 : 2);
}

export function getStatusLabel(status: number): string {
  switch (status) {
    case WORKFLOW_STATUS.UNINITIALIZED: return 'Uninitialized';
    case WORKFLOW_STATUS.PENDING: return 'Pending';
    case WORKFLOW_STATUS.CLAIMABLE: return 'Claimable';
    case WORKFLOW_STATUS.CLAIMED: return 'Claimed';
    case WORKFLOW_STATUS.CANCELLED: return 'Cancelled';
    default: return `Unknown (${status})`;
  }
}
