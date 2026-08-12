# V1 remote build reproduction

Date: 2026-08-09  
Source commit: `addc7a9092a8ef3421815c319840b6d205214f73`

## Environment

- GitHub Codespace: `triggerdesk-rialo-lab-q54xxrwjgw524466`
- machine: `standardLinux32gb` (4 CPU, 16 GB RAM, 32 GB workspace)
- OS: Ubuntu 24.04.4 LTS, x86_64
- Node: 24.14.0
- npm: 11.9.0
- host Rust/Cargo: 1.97.1
- installed Rialo release: `stable@0.12.2`
- `rialo`: `0.12.2-4a906f80d5e2`
- `rialo-build`: `0.12.2-4a906f80d5e2`
- Rialo Rust toolchain: `0.0.3`
- Rialo Cargo: `1.89.0-dev (7918c7eb5 2025-04-27)`
- Rialo Rust: `1.89.0-dev`, LLVM 20.1.4
- target: `riscv64emac-solana-solana`
- Venus crates: locked to `0.12.2`

The current S3-hosted Rialo installer returned HTTP 200 and installed successfully.
The obsolete `rialoman.rialo.io` host still did not resolve. The S3 installer
identified its bundled manager as `rialoman 0.3.0-alpha.0`; this differs from the
published stable crate version `0.3.0`, but its release manifest resolved Rialo
`stable@0.12.2` and the required `rialo-rust 0.0.3` toolchain correctly.

## Application validation

The Codespace passed `npm ci`, lint, typecheck, 4 test suites/26 tests, and the
Next.js 16.3.0 production build before contract compilation.

## Generated interfaces

Both builds regenerated their WIT and Venus manifest files. `git diff --exit-code`
confirmed that all four generated interface files are byte-identical to the
checked-in versions.

## Artifact results

| Program | Fresh/checked-in SHA-256 | Result |
|---|---|---|
| Scheduled Transfer V1 | `f0ede60dcd4471c0f1961cca76ad7d04e822fd727a0fc72b4425b563a89d256a` | exact match |
| Recurring Allowance V1 | `c8bcdc706730aeb5dd1cb912124bc951c2bd5cc7443266e290ad43148c5c15bb` | exact match |

Rialo 0.12.2 embeds Cargo registry source paths in PolkaVM output. A normal
Codespace build under `/home/codespace/.cargo` was deterministic but 16 bytes
larger because the deployed V1 binaries embed `/home/achinnys/.cargo`. Building
the same locked source with `CARGO_HOME=/home/achinnys/.cargo` reproduced both
deployed hashes exactly. `scripts/verify-rialo-v1.sh` records this historical
condition explicitly. New contract versions must use a canonical build path or
compiler path remapping so reproducibility does not depend on a person's username.

## Gate conclusion

The remote compiler environment is trusted for the next security gate. This
evidence proves V1 source/artifact identity; it does not prove funds movement.
