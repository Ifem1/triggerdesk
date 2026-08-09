export interface ScheduledTransferState {
  discriminator: bigint;
  recipient: string;
  amountKelvin: bigint;
  scheduledAt: bigint;
  createdAt: bigint;
  status: number;
}

export interface WorkflowInfo {
  pdaAddress: string;
  state: ScheduledTransferState;
  ownerProgramId: string;
}

export interface CreateScheduledTransferParams {
  recipientAddress: string;
  amountRlo: string;
  delaySeconds: number;
}

export interface RecurringAllowanceState {
  discriminator: bigint;
  recipient: string;
  amountKelvin: bigint;
  intervalSeconds: bigint;
  totalDistributed: bigint;
  distributionCount: bigint;
  createdAt: bigint;
  status: number;
}

export interface CreateRecurringAllowanceParams {
  recipientAddress: string;
  amountRlo: string;
  intervalSeconds: number;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  publicKey: string | null;
  balanceKelvin: bigint | null;
  isDevnet: boolean;
}
