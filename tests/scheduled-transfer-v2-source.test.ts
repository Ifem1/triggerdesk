import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
  resolve(process.cwd(), 'programs/scheduled-transfer-v2/src/lib.rs'),
  'utf8',
);

describe('Scheduled Transfer V2 vault surplus policy', () => {
  it('accepts a vault with enough principal instead of requiring an exact balance', () => {
    expect(source).toContain('vault_account.kelvins() < self.amount');
    expect(source).not.toContain('vault_account.kelvins() != self.amount');
  });

  it('keeps the recipient payout exact and sweeps only surplus to the stored creator', () => {
    expect(source).toContain('.checked_sub(self.amount)');
    expect(source).toMatch(/vault_account\.key,\s+recipient_account\.key,\s+self\.amount/);
    expect(source).toMatch(/vault_account\.key,\s+creator_account\.key,\s+surplus/);
    expect(source).toContain('*creator_account.key != self.creator');
  });
});
