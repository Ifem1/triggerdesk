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

## P0 surplus-deposit hardening (2026-08-12)

Implementation/evidence commit: `e2a0cc80b8f82fdb16494f93d78585a6a2b1749f`.

The historical program required an exact vault balance and was vulnerable to
availability griefing: a positive unsolicited system transfer into the public
vault PDA made both execution and cancellation reject before moving principal.
The P0 test deployment below changes validation to `vault_balance >= amount`.
It transfers the immutable principal exactly, then atomically returns only the
surplus to the immutable stored creator. The recipient never receives surplus.

- Program: `3BA494eLRy15oHN4ST2Fq8Bx231xdPDfJy1tpP7hyoD6`
- Owner: `RiscVLoader11111111111111111111111111111111`
- Loader header: 48 bytes; account: 141,026 bytes; executable payload: 140,978 bytes
- Artifact and direct deployed payload SHA-256:
  `c010cc54305fdf2a71592639377cd95e781da798a45aa6d8fdc4c10570c840d1`
- WIT SHA-256: `669528a39a25be1249b420a3d9cecd0f7f81a649e2178d993632681ac79d1c5d`
- Generated manifest SHA-256: `e203de1203af0dab885a13f9f27c80680dd212ff5e35e64e575aa9b4f2f8926b`
- Client manifest SHA-256: `132a31e7db12108d0710372a83a9a7de2e9b5418d6f0e4f2cbc20a272b79e153`

The first deploy attempt had no program-account or deployer signatures because
the disposable deployer had 999,990,000 kelvins, below the Loader V4 buffer
rent requirement. After one additional disposable 1-RLO faucet grant, the same
program identity deployed successfully; direct account data was base64-decoded,
the first 48 bytes removed, and the resulting payload hash matched exactly.

### Execution with unsolicited surplus

All amounts below are kelvins; principal is 1,000,000.

| Case | Create | Surplus transfer | Callback | Vault before callback | Recipient delta | Terminal result |
| --- | --- | --- | --- | ---: | ---: | --- |
| `+1` | `3wL36zEoUpuHt1NYUGW4TGCDe4Pptgq5srebW3AMJUSBSjXaVfPd5fEkWESxYHm48X8mvyi4CKPYkzj5276jc3sr` | `5C5EBWBKeLWP4gB8w9y78pgF3SW6q2BK5JTocoqLA9DuiLwyHm68791e15DR9qNyoKw7DUs1MSGyC8Skr2jYKeEV` | `3XaNFmwSKAiJV45mE5HWqFYHYpeGZDTBReorcFk4menT7dUiaWxCMtstHJPsMyrBy1bmv25dixQRvMe7S264Kyhq` | 1,000,001 | 1,000,000 | vault/subscription removed |
| `+1000` | `3Z3fum63eYz2ABJ9BUk2za9Z6AjutAZR9U9sD5DuPcNFxBQJC4xJgSopxpJQk835ZBoqjQVu5qJGsQ1bU7D4d4Ks` | `2gn94kiXJknPQ6MNbxh7s7S3Vsm5c8SA3RnMGhACJhCWV6ecLewYHqdNXtHCcqLA3vJvFJFj3pJt591ApAr7XZ5p` | `4JGNtBM7gi5FEU74KTaHJR8xHWad6o5GrFPHPr5U2rpb6EaibyJH97dYwvWA5tUjBFqBPsWyYcg27W5rS6vHXpbZ` | 1,001,000 | 1,000,000 | vault/subscription removed |

Creator: `Csgoy8TnEp7kZk8STr9gK8bPyLkUG6sVJhWYni2Xmwom`; recipient:
`3t9AHak5yop4MQPrpEWfaSmwVK1EMfEMzpfofAT1L7Kb`. Recipient balances were
44,000,000 -> 45,000,000 and 45,000,000 -> 46,000,000 respectively. Each
callback logged two successful system CPIs followed by `paid=1000000`; this is
the exact-principal transfer plus creator-only surplus sweep.

### Surplus cancellation and idempotence

- Workflow: `63tPU6Q223ZXt8eTWXPCRBozNe8qPBuK67pgDvVj9APo`
- Vault: `4vUFtvXTeB3yRUZBtDZdbj61e9rkLiiSw5PBEjCMjmv5`
- Subscription: `6Ju4A3kh8hRVGFv9sKrYG4Li94YuzXGYmHe3bGSMApry`
- Create: `2tpcyLfFDZd7vRy4Cu1r2zx6ZXgCAMVYWRyiho6p7QpxRxnV8GdVdahQjq9Yk2ckJmFgjjhVhhd63DJX61Hf6SJ9`
- `+1` transfer: `4JKWdsBNc9QaJRSquSVSCZjUDus2EQYD53BqDgjmkKP47hHySeBorAcyhPAb1A6SZcHJ6jShevRRhaftgwZqZ1EQ`
- Cancel: `4tVdAs2W2AVFgXkbTh7gN58fcoCAoQPmnW5dyjNt7b46XcVL2pTS3rUqWCZPSEfm6XNkyVMHi9tcCPnFn1zwtZvE`
- Repeat cancel: `51BwF3ZZorD74GWBcs4ZXPRbVCmDYTp9oiQwUxSctCnS6YVrunSuCvTYFLk4UrtTREPdCySWk7aygaymZTsT2VW3`

The vault was observed at 1,000,001 before cancel. Cancel logs show
`DestroySubscription`, two successful system CPIs, and `refunded=1000000`.
Final state is Cancelled, recipient remained at 46,000,000, and both vault and
subscription are absent. Repeat cancel logged no system CPI and charged only
the normal 5,000-kelvin transaction fee.

### Normal path, replay boundary, and authorization boundary

The no-surplus workflow `5zDpXtHdwjxhHSSkvgPhsARvsScpeCfgrBnXR5BZMXy4`
used vault `9KFPchuHtsSupvQBBeBoRC2Cv8j1vUbMweX9bC734UW4` and subscription
`F6SjaaJCgvx6DXBmt47RHVN8iqoqWXPV27stUFNxHv9x`. Create transaction
`3B8KHTL93MygzA4XoRv2GGYY53eBJGEdVp5HFzUCRe4pNiVpqLS8urVyLcnSatgepAXY9pEAUJSvhXxxVFqCFW7s`
triggered callback
`MFake834kzLkM2ej8YJ96EXjBomm7anN3ggzyahL3L3BsPpVfb1hWCrWuu89ChfA1wchXLqhaCCXqUWFa2h24A3`.
Recipient moved exactly 46,000,000 -> 47,000,000; final status is Executed
and vault/subscription are absent.

The public manifest exposes only `create`, `cancel`, and `get_state`; an
explicit callback replay request is rejected locally with `Instruction
'execute' not found in manifest` and cannot construct a transaction. The
completed workflow's vault and subscription are absent, and recipient stayed
47,000,000 before and after that attempt. Thus the native subscription cleanup
and terminal state are the reachable replay boundary in the supported interface.

For unauthorized cancellation, a separate signer attempted `cancel` with the
victim slug. Rialo's workflow PDA derivation is payer+slug, so it derived the
attacker context and failed with `InvalidAccountData` / `No workflow to
continue` before it could present the victim workflow. No victim value moved.
This is an outer runtime authorization boundary; the contract independently
enforces `creator_account.is_signer && creator_account.key == stored creator`
before cancellation as defense in depth.
