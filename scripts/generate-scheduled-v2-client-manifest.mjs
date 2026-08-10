import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const programDir = resolve('programs/scheduled-transfer-v2/wit');
const generatedPath = resolve(programDir, 'scheduled-transfer-v2-manifest.json');
const clientPath = resolve(programDir, 'scheduled-transfer-v2-client-manifest.json');
const manifest = JSON.parse(await readFile(generatedPath, 'utf8'));
const accounts = manifest.instructions?.cancel?.accounts;

if (!Array.isArray(accounts)) {
  throw new Error('generated manifest has no cancel account list');
}

const expected = [
  'payer',
  'workflow_pda',
  'system_program',
  'subscriber_interface',
  'subscription',
  'vault',
];
if (accounts.map(({ name }) => name).join(',') !== expected.join(',')) {
  throw new Error(
    `unexpected Rialo 0.12.2 cancel account order: ${accounts
      .map(({ name }) => name)
      .join(',')}`,
  );
}

// Venus 0.12.2 assigns the two WriteAccountInfo resources at internal
// indices 3 and 4, while its manifest inserts the subscriber executable at
// index 3. Keep the executable in the outer instruction, after those inputs.
manifest.instructions.cancel.accounts = [
  accounts[0],
  accounts[1],
  accounts[2],
  accounts[4],
  accounts[5],
  accounts[3],
];

await writeFile(clientPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(clientPath);
