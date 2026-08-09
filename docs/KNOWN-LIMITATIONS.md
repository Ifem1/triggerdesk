# Known limitations and blockers

## BLOCKED BY CURRENT RIALO/VENUS INTERFACE: safe autonomous custody

### Missing capability

The current Venus 0.12.2 workflow interface used by TriggerDesk does not expose
an evidenced way for a workflow callback to receive and validate an arbitrary
recipient plus deterministic vault account, then execute a program-authorized
native RLO transfer and partial refund. Venus' documented public helper surface
contains workflow storage and full account closure, while the lower-level Rialo
runtime exposes CPI and `invoke_signed`. The missing proof is the safe bridge
from generated Venus workflow handlers to the required account context and PDA
signer behavior.

### What was tested and inspected

- complete V1 Rust sources, generated WIT, and manifests;
- exact deployed executable payloads on DevNet;
- installed `@rialo/ts-cdk` 0.12.2 source and transfer/signer APIs;
- published Rialo 0.12.2 crate documentation for CPI and Venus;
- current official Rialo learning material for reactive transfers;
- toolchain availability on this machine (no Rust, WSL, or Docker);
- the repository's documented installer host, which failed DNS resolution on
  2026-08-09.

### Exact remaining work

1. Obtain a supported pinned Rialo Rust/Venus build environment.
2. Generate and inspect expanded Venus code or use the official raw-program
   interface to define explicit account lists.
3. Prove workflow/vault PDA signer seeds and native-transfer instruction bytes.
4. Implement versioned V2 state, atomic funding, exact transfer, creator-only
   cancellation, partial refunds, and terminal replay protection.
5. Run adversarial contract tests and DevNet E2E tests proving recipient and
   refund balance deltas.
6. Record deployment transactions, new program IDs, manifests, and hashes.

### Why no workaround was introduced

Browser cron, centralized keepers, mock transfers, state-only success counters,
and guessed discriminants would not establish autonomous value execution and
could put funds at risk. TriggerDesk remains explicitly DevNet-only and the V1
programs are described as state-transition proofs until the above is verified.

## BLOCKED BY RIALO: production wallet and mainnet

No official production-ready Rialo mainnet and end-user wallet integration have
been verified for this release. The page-generated session key remains restricted
to an explicitly experimental DevNet experience. TriggerDesk must not accept or
claim production real-value use until official network, explorer, fee, wallet,
deployment, and upgrade semantics are verified.

