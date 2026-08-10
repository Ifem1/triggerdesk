# Scheduled Transfer V2 DevNet evidence

Evidence date: 2026-08-09  
Network: Rialo DevNet  
Final program: `FkqUGXxy8y4PHGdRmtJLvKMp1h48EeeWaz8KCFi9ZAwS`  
Artifact SHA-256: `583ba4f95924f03e29ff4f2fc6ddb7e5d81cc2556ebe8b649c2038898dd537a2`

The 48-byte loader header was removed from the deployed account before hashing.
The deployed payload and checked-in PolkaVM artifact hashes match exactly.

## Architecture and invariants

V2 is a new schema and program identity. Creation atomically creates a zero-data,
system-owned vault PDA funded with the exact principal and registers a Rialo
one-shot AFTER subscription. The callback validates schema, scheduled state,
immutable recipient, immutable vault, PDA derivation, owner, data length, and
exact vault balance. It performs PDA-signed native transfer before changing state.
Cancellation verifies the creator signer, destroys the native subscription, sends
the exact principal back from the PDA, and only then records terminal state. CPI
and state changes share transaction atomicity.

## Autonomous payment

- Create transaction: `2RNR2zKyRPLE3Vz5yvHqRRyGDNHU3dcogdifNAWdqi2BEMMpt9ynwDutM21YXH7nFvc18Xd3ZfknQZuAKh8NStUc`
- Native callback: `3x9X78Bjttfc9NyVxwVGG4vAeN5fsT3G88xt2cwqHW6h5eNpZbYnUmnUL57cdmG33AKUC9qnzZdYyBN4FBELeAAT`
- Workflow: `FU6fF231a4byUrV2T6J2tcfmQmyjjLSFb5vckf1MvEp1`
- Vault: `EkJntUj1Nk9doE3pU6sBsxKp9awpkSt3wmWLJAvBTpVh`
- Recipient: `3t9AHak5yop4MQPrpEWfaSmwVK1EMfEMzpfofAT1L7Kb`
- Amount: 2,000,000 kelvin (0.002 RLO)
- Recipient before: 0.015 RLO
- Recipient after: 0.017 RLO

Rialo workflow lineage links the create transaction to the native callback at
the requested timestamp. The callback logs a successful system-program CPI and
`paid=2000000`; its one-shot subscription is then destroyed. Both vault and
subscription accounts ceased to exist. No browser, Codespace process, cron, or
keeper executed the payment.

Explicit replay transaction
`29jH7epen1RrY4uMujeFHzZnkiwDw7iTvkAzd95FbnVuk4gpWSjVU6j2NASPes4xwBkZ9dxwMZi5d5CPmiNzFvVX`
failed with `InvalidAccountData`, had no inner instructions, and left the
recipient at 0.017 RLO.

## Cancellation and refund

- Create transaction: `4iXBSuCEEmUidxnWDy37vcwRJWik52YqNXYAFZB5ptzuq9d1wP2kUDGkr5aEbU7dLMJiLqjKsypEzA6jKrnDLvVj`
- Cancel transaction: `5twDSh1j13yjSzkP3QroqnxEokkxdFB7F5mjN7U1yy4QaaDSGhBpXZ1sukNF2X1DWtVwP73KXMHNmXyudqbs6Dvi`
- Repeat cancel: `5JxxP2S9GNL6GAuUnbGGS4A4iVcoQ8MpzG7FREoq5EcFpEpFcof9Y35Ztuxk1RJ6qZWMVW5mHQY4yVho9atAFheg`
- Vault: `B3Sd249ppyEroGt1bao6XFVNWgRxoa6RiQ6ydSr8Ayre`
- Subscription: `9VzTowobC3w9V8UQNWxGHctF1yWhzZkz5TmJB12VPJyy`
- Principal: 3,000,000 kelvin

The successful cancel first invoked `DestroySubscription`, then transferred
exactly 3,000,000 kelvin to the creator. Creator balance moved from 1.16241468
to 1.17122128 RLO: principal 0.003 + returned subscription rent 0.0058116 - fee
0.000005. The recipient remained at 0.017 RLO. Vault and subscription accounts
ceased to exist. Repeat cancel succeeded with no inner instructions and changed
the creator balance by only the 5,000-kelvin fee.

## Venus 0.12.2 compiler defect

Expanded Rust assigns cancel resources as payer/workflow/system/subscription/vault,
but the generated manifest inserts `subscriber_interface` before the two user
accounts. The checked-in `scheduled-transfer-v2-client-manifest.json` moves the
executable account after those resources. It is generated deterministically by
`scripts/generate-scheduled-v2-client-manifest.mjs`, which fails closed unless
the upstream generated order is exactly the audited 0.12.2 shape. The executable
remains in the outer instruction for subscriber CPI. This is an interface-order
correction, not a guessed discriminant or account substitution.

## Remaining limitation

Venus 0.12.2 generates `active_commits = slot..=slot + 100` for AFTER timers.
A controlled five-minute workflow outlived that range and did not execute. This
prevents truthful arbitrary future scheduling on 0.12.2 even though short-window
funds execution is proven. Current supported stable Rialo compatibility must be
investigated before the product UI can claim general scheduled transfers.
