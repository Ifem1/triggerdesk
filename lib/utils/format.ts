export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function formatValue(value: number | string): string {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return String(value);
}

export function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
