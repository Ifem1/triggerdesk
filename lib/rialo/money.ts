import { KELVIN_PER_RLO } from './constants';

export const U64_MAX = 18_446_744_073_709_551_615n;
const RLO_DECIMAL = /^(0|[1-9]\d*)(?:\.(\d{1,9}))?$/;

export function parseRloToKelvin(input: string): bigint {
  const normalized = input.trim();
  const match = RLO_DECIMAL.exec(normalized);
  if (!match) {
    throw new Error('Enter an RLO amount with no more than 9 decimal places.');
  }
  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(9, '0') || '0');
  const kelvin = whole * BigInt(KELVIN_PER_RLO) + fraction;
  if (kelvin <= 0n) throw new Error('Amount must be greater than zero.');
  if (kelvin > U64_MAX) throw new Error('Amount exceeds the on-chain u64 limit.');
  return kelvin;
}

export function formatKelvin(kelvin: bigint): string {
  if (kelvin < 0n) throw new Error('Kelvin amount cannot be negative.');
  const unit = BigInt(KELVIN_PER_RLO);
  const whole = kelvin / unit;
  const fraction = (kelvin % unit).toString().padStart(9, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function checkedMultiply(value: bigint, count: bigint): bigint {
  if (value < 0n || count < 0n) throw new Error('Values cannot be negative.');
  const product = value * count;
  if (product > U64_MAX) throw new Error('Total exceeds the on-chain u64 limit.');
  return product;
}
