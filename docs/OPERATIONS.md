# Operations

TriggerDesk currently supports only `rialo:devnet`. Unknown environments fail
closed. Program identities and artifact hashes live in `deployments/devnet.json`.

## Release gate

1. Verify clean checkout and locked install.
2. Run lint, typecheck, unit tests, production build, and dependency audit.
3. For program changes, reproduce the pinned build and compare manifest/state
   layout before any deployment.
4. Run adversarial program tests and disposable DevNet E2E balance proofs.
5. Record source commit, artifact/manifest hashes, deployment transaction, program
   IDs, compiler/CDK versions, and migration notes.
6. Deploy the frontend only after its registry contains the verified program IDs.
7. Never automatically deploy financial programs from a merge to `main`.

## Monitoring

Poll `/api/health` for frontend and DevNet RPC availability. Alert on sustained
503 responses, RPC p95 latency above 5 seconds, transaction `executed:false`, an
active workflow past its expected callback window, duplicate callback attempts,
underfunded/mismatched vaults, or activity against terminal V2 workflows.

Logs may contain request ID, allowlisted RPC method, response class, and latency.
They must not contain signing bytes, private keys, mnemonics, raw request bodies,
or environment values.

## Recovery

- RPC outage: show degraded/unknown state, stop new submissions when correctness
  is uncertain, never retry writes blindly, and let existing native workflows run.
- Frontend outage: restore the last verified immutable deployment. On-chain state
  remains authoritative.
- Rialo incident: stop creation, retain receipts, publish a status notice, and
  resume only after official recovery evidence.
- V2 callback failure: do not pay from a backend. Investigate chain state and use
  only a predesigned on-chain recovery instruction.

