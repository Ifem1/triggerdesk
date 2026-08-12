# Baseline audit

Date: 2026-08-09  
Source: `main` at `6a76dfd7fd88dddd4a93d59279bd99f77ea49ca0`

## Toolchain

| Tool | Version/status |
|---|---|
| Node | 24.16.0 |
| npm | 11.13.0 |
| Next.js | 16.3.0 after security update (baseline was 16.2.9) |
| TypeScript | 5.9.3 |
| `@rialo/ts-cdk` | 0.12.2 |
| Rialo/Venus crates | 0.12.2 in both lockfiles |
| Rust/Cargo | Not installed in the available Windows environment |
| WSL/Docker | Not installed |
| documented Rialo installer | `rialoman.rialo.io` failed DNS resolution during verification |

## Clean-checkout results

The original baseline failed tests and typechecking because two tests imported
deleted `lib/simulation` modules. Lint reported eight errors. The production
build also required a Google Fonts network fetch. `npm audit` reported three
high-severity dependency findings through Next.js 16.2.9.

After Milestone 1 remediation:

- `npm ci`: pass;
- `npm run lint`: pass;
- `npm run typecheck`: pass;
- `npm test -- --runInBand`: pass, 17 tests;
- `npm run build`: pass with Next.js 16.3.0;
- `npm audit`: zero known vulnerabilities.

## Program and artifact evidence

The checked-in artifacts were hashed with SHA-256. Both configured DevNet
program accounts are executable and owned by the Rialo RISC-V loader. Removing
the loader's 48-byte account header produces payloads whose hashes exactly match
the checked-in PolkaVM artifacts. See `deployments/devnet.json` for IDs and
hashes.

This proves the checked-in V1 artifacts correspond to the current deployments;
it does not prove a reproducible source build on this machine. That requires the
pinned Rialo Rust toolchain.

## Cancellation interface evidence

Both Rust sources contain `terminating fn cancel`, but neither generated V1
manifest exposes it. The deployed binaries' serialized instruction enum names
only `GetState`, the timer callback, and `Schedule`/`Setup`; no cancel instruction
or cancel log text is present. The deployed payloads exactly match those binaries.

Therefore cancellation is not treated as externally callable. No discriminant
was guessed and no cancellation UI was added.

