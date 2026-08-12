import { PublicKey } from '@rialo/ts-cdk';
import {
  decodeWorkflowState,
  formatKelvinAsRlo,
  getStatusLabel,
} from '../lib/rialo/scheduled-transfer';
import {
  decodeAllowanceState,
  getAllowanceStatusLabel,
} from '../lib/rialo/recurring-allowance';
import {
  ALLOWANCE_STATUS,
  SCHEDULED_TRANSFER_PROGRAM_ID,
  WORKFLOW_STATUS,
} from '../lib/rialo/constants';

const recipient = PublicKey.fromString(SCHEDULED_TRANSFER_PROGRAM_ID);

describe('current Rialo workflow account decoding', () => {
  test('decodes the active scheduled-transfer V2 layout', () => {
    const data = new Uint8Array(256);
    const view = new DataView(data.buffer);
    view.setBigUint64(0, 42n, true);
    data[8] = 2;
    data[9] = WORKFLOW_STATUS.SCHEDULED;
    data.set(recipient.toBytes(), 10);
    data.set(recipient.toBytes(), 42);
    data.set(recipient.toBytes(), 74);
    data.set(recipient.toBytes(), 106);
    view.setBigUint64(139, 1_500_000_000n, true);
    view.setBigUint64(147, 2_000_000_000_000n, true);
    view.setBigUint64(155, 1_500_000_000n, true);

    expect(decodeWorkflowState(data)).toEqual({
      discriminator: 42n,
      schemaVersion: 2,
      creator: recipient.toString(),
      recipient: recipient.toString(),
      vault: recipient.toString(),
      subscription: recipient.toString(),
      amountKelvin: 1_500_000_000n,
      scheduledAt: 2_000_000_000n,
      fundedAmount: 1_500_000_000n,
      paidAmount: 0n,
      refundedAmount: 0n,
      createdAt: 0n,
      status: WORKFLOW_STATUS.SCHEDULED,
    });
  });

  test('decodes the checked-in recurring-allowance V1 layout', () => {
    const data = new Uint8Array(256);
    const view = new DataView(data.buffer);
    view.setBigUint64(0, 7n, true);
    data.set(recipient.toBytes(), 8);
    view.setBigUint64(40, 250_000_000n, true);
    view.setBigUint64(48, 60n, true);
    view.setBigUint64(56, 500_000_000n, true);
    view.setBigUint64(64, 2n, true);
    view.setBigUint64(72, 1_900_000_000n, true);
    data[80] = ALLOWANCE_STATUS.ACTIVE;

    expect(decodeAllowanceState(data)).toEqual({
      discriminator: 7n,
      recipient: recipient.toString(),
      amountKelvin: 250_000_000n,
      intervalSeconds: 60n,
      totalDistributed: 500_000_000n,
      distributionCount: 2n,
      createdAt: 1_900_000_000n,
      status: ALLOWANCE_STATUS.ACTIVE,
    });
  });

  test('maps current status values without pretending unknown state is valid', () => {
    expect(getStatusLabel(WORKFLOW_STATUS.EXECUTED)).toBe('Executed');
    expect(getStatusLabel(255)).toBe('Unknown (255)');
    expect(getAllowanceStatusLabel(ALLOWANCE_STATUS.COMPLETE)).toBe('Complete');
    expect(getAllowanceStatusLabel(255)).toBe('Unknown (255)');
  });

  test('rejects truncated and unknown scheduled-transfer V2 state', () => {
    expect(() => decodeWorkflowState(new Uint8Array(64))).toThrow(/too short/);
    const data = new Uint8Array(179);
    data[9] = 255;
    expect(() => decodeWorkflowState(data)).toThrow(/Unknown/);
  });

  test('rejects truncated and unknown recurring-allowance V1 state', () => {
    expect(() => decodeAllowanceState(new Uint8Array(80))).toThrow(/too short/);
    const data = new Uint8Array(81);
    data.set(recipient.toBytes(), 8);
    data[80] = 255;
    expect(() => decodeAllowanceState(data)).toThrow(/Unknown/);
  });

  test('formats exact whole and fractional Kelvin values', () => {
    expect(formatKelvinAsRlo(1_000_000_000n)).toBe('1');
    expect(formatKelvinAsRlo(1_250_000_000n)).toBe('1.25');
  });
});
