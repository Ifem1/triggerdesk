# Rialo Linux build and test environment

TriggerDesk uses a persistent Ubuntu 22.04 host for Rialo/Venus compilation, deployment, and DevNet testing. The host is development infrastructure only. It has no scheduler, keeper, private-key service, or role in runtime workflow execution.

The runtime boundary remains:

```text
TriggerDesk client -> Rialo native subscription -> Venus program -> on-chain execution
```

## Minimum host

- Ubuntu 22.04, x86_64 or aarch64
- 4 vCPU, 8 GB RAM, 80 GB disk
- SSH/shell and sudo access
- outbound HTTPS and DNS

## Bootstrap

Clone `codex/triggerdesk-10of10`, then run:

```bash
chmod +x scripts/bootstrap-rialo-dev.sh scripts/verify-rialo-v1.sh
./scripts/bootstrap-rialo-dev.sh
./scripts/verify-rialo-v1.sh
```

The bootstrap records OS, architecture, DNS, HTTP responses, installed binary paths, Rust/Cargo versions, Rialo version, and the custom target. Logs are written under `.rialo-bootstrap/`; V1 reproduction evidence is written under `.rialo-evidence/v1/`. Both directories are evidence outputs and must not contain signing keys.

## Pinned compatibility facts

- TriggerDesk contracts and `@rialo/ts-cdk`: `0.12.2`
- `rialoman`: `0.3.0`
- Rialo Rust toolchain release: `0.0.3`
- custom target: `riscv64emac-solana-solana`
- source-build nightly: `nightly-2025-05-10`
- pinned Rust source commit: `dcecb99176edf2eec51613730937d21cdd5c8f6e`

These source-build values come from the published `rialo-build-lib 0.12.2` crate, which embeds the Rialo RISC-V backend patch and source builder. The current official `rialoman 0.3.0` documentation uses the S3 installer URL in the script; `rialoman.rialo.io` is retained only as a diagnostic probe because it was the older documented endpoint.

## Fallback behavior

The script follows the supported chain without hiding failures:

1. install `rialoman` from Rialo's current hosted installer;
2. if unavailable, install the official `rialoman 0.3.0` crate;
3. install Rialo `stable@0.12.2`;
4. install prebuilt `rialo-rust 0.0.3`;
5. if unavailable, compile and run the checked-in helper pinned to `rialo-build-lib =0.12.2`, which invokes its official source-toolchain build path.

The source build is intentionally not replaced with a generic Rust/Solana target. Successful validation requires `rustc +rialo` to list the exact Rialo custom target.
