# TriggerDesk DevNet demo guide

## What it demonstrates

TriggerDesk's verified Scheduled Transfer V2 proof demonstrates native Rialo
automation: a creator funds a PDA-controlled escrow and Rialo's subscription
callback transfers the exact RLO principal later. No keeper, browser, backend,
or Codespace process participates after creation.

Architecture: Browser → Rialo transaction → workflow PDA → escrow vault →
native subscription → callback → exact RLO transfer.

## Current presentation state

The public create controls are intentionally unavailable. Stable Venus 0.12.2
generates a 100-commit timer lease and the 5/10/15/20-second DevNet reliability
matrix produced no 3/3 safe interval. Do not present this as a production or
arbitrary-duration scheduler.

Use the existing completed V2 proof as the fallback presentation record:

- Program: `3BA494eLRy15oHN4ST2Fq8Bx231xdPDfJy1tpP7hyoD6`
- Normal payment create: `3B8KHTL93MygzA4XoRv2GGYY53eBJGEdVp5HFzUCRe4pNiVpqLS8urVyLcnSatgepAXY9pEAUJSvhXxxVFqCFW7s`
- Native callback: `MFake834kzLkM2ej8YJ96EXjBomm7anN3ggzyahL3L3BsPpVfb1hWCrWuu89ChfA1wchXLqhaCCXqUWFa2h24A3`
- Recipient balance: 46,000,000 → 47,000,000 kelvin (exactly 1,000,000)

The `+1` and `+1000` surplus cases, cancellation, and replay boundary are
recorded with full transaction IDs in `docs/SCHEDULED-TRANSFER-V2-E2E.md`.

## Judge answers

- **Why Rialo?** Its native subscription runtime can execute a stored callback.
- **Why no keeper?** The post-creation callback is scheduled by Rialo, not an application process.
- **Who holds funds?** A program-derived system-owned vault; terminal paths enforce immutable recipient/creator destinations.
- **Can it pay twice?** Terminal state and subscription/vault cleanup prevent a second payout.
- **Can another person cancel?** No; cancellation requires the immutable stored creator signer.
- **What about surplus?** Exact principal goes to the recipient; surplus returns only to the immutable creator.
- **Why is timing unavailable?** The stable Venus generator's fixed timer lease is not reliable on DevNet.
- **Is it mainnet/production?** No. This is DevNet-only evidence and a toolchain limitation is explicitly surfaced.
