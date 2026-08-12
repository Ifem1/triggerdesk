# Rialo funds-path probe

Date: 2026-08-09  
Source commit before probe: `033bab2`  
Network: Rialo DevNet (`http://devnet.rialo.io:4100`)  
Toolchain: Rialo `0.12.2-4a906f80d5e2`, `rialo-rust-0.0.3`, target
`riscv64emac-solana-solana`

This is a disposable capability probe. It is not a TriggerDesk payment
contract and is not wired into the product UI.

## Compiler-generated callback account interface

`programs/funds-path-probe` compiles an `AFTER` handler with two explicit
account bindings. The generated manifest establishes the callback order and
permissions without a hand-written account resolver:

1. `payer`: signer, writable;
2. `workflow_pda`: derived from the payer and workflow slug, writable, owned
   by the probe program;
3. `system_program`: well-known, executable, readonly;
4. `recipient`: callback parameter, writable, not a signer;
5. `vault`: callback parameter, writable, not a signer.

The callback serializes the workflow slug, branch number, immutable recipient,
and immutable vault. Venus rewrites each `WriteAccountInfo::from(parameter)` to
the corresponding manifest-resolved `AccountInfo` index. The checked-in WIT
and manifest are the compiler-generated evidence.

## Verified Rialo APIs

The implementation uses only APIs verified in installed Rialo 0.12.2 source:

- `Pubkey::find_program_address` for the vault;
- `rialo_s_cpi::invoke_signed` with the documented seed-plus-bump layout;
- `rialo_s_system_interface::instruction::create_account` to create and fund
  a zero-data, system-owned vault PDA;
- `rialo_s_system_interface::instruction::transfer` for native RLO movement.

The vault seeds are `triggerdesk-vault`, creator pubkey bytes, and the 32-byte
workflow slug. Setup derives and compares the supplied vault before funding it.
The handler compares both callback accounts to immutable state before CPI and
sets `transferred = true` only after CPI succeeds.

## Build evidence

- PolkaVM SHA-256:
  `f3edd8503087a987ea6b2cadee8d6352256f71d2e908a5a0b2d20c6c698d01ba`
- manifest SHA-256:
  `840375773d9e0f173a172c05ef7bd26a8fa86eb771892b9eb9a773f5b5985529`
- WIT SHA-256:
  `55512730dfcda35497f7d776a5a85694beb193a6062a4e31565271dd9e9429e5`
- DevNet program ID:
  `5PCb6Mpows3T5kLYhCTZRqJkBrdDe7dbGCD2KAeqdMqk`

Loader V4 initially appeared to hang. A captured DevNet transaction proved the
actual failure was insufficient rent funding:

- transaction:
  `3fTjLKxpuxeCDDRRykSLStH5aURG2vcrHfRpXDCLuS8S3FfKAKnozR63qJFGD9Qvd4QHytVkNK65yjBmacLRjUzZ`
- on-chain error: `Transfer: insufficient kelvins 999960000, need 1068062112`

After a second faucet-compliant 1 RLO airdrop, deployment succeeded. This also
records a Rialo 0.12.2 CLI defect: after the failed buffer-creation transaction,
the CLI polls forever for the nonexistent buffer rather than surfacing the
transaction error.

## Successful native AFTER transfer

- creator/deployer:
  `SkxZX29Yc6ogUEVNkw4sKXHkDkXMyiZEbngdQF6Lg8L`
- recipient:
  `3t9AHak5yop4MQPrpEWfaSmwVK1EMfEMzpfofAT1L7Kb`
- vault PDA:
  `GLzYghpc2aT2PUSxSihbKFS4ozopixmSowqgDzszQfu2`
- setup transaction:
  `3BSQph9h8r5jRndiyKcKu9R5ySbDcYHFgd5nKxXbsfGLiSm5Rbe58pqeGnePWATFLuEHUYJW2KG2C8HcMPKUyAtA`
- autonomous callback transaction:
  `ZVxSgrjyFg4MCz79AzcQ1yYWWqsvgBEwnCnqJ1wri3jdyVYA1dcpoF49aHSNKyJz2fmkMZzFAJpQxNrLCUg4mWw`
- amount: `1,000,000` kelvins (`0.001 RLO`)
- recipient before: `0` kelvins
- recipient after: `1,000,000` kelvins
- exact delta: `1,000,000` kelvins

The setup transaction logs native `SubscribeToEvent`, creates the vault through
signed CPI, and exits. The callback transaction is a distinct protocol-triggered
transaction. Its logs show branch 1, `Continue workflow`, a successful system
program CPI, the exact vault/recipient/amount log, and `DestroySubscription`.
The drained zero-data vault was removed, and the on-chain workflow account
remained with `transferred = true`.

## Adversarial wrong-seed result

A separate workflow deliberately changes the stored bump before
`invoke_signed`:

- setup transaction:
  `2jPsAFDJcEKsz4Gx8sQDefX7PBrzt7uT8UYAYAkUhkgx2fzxEfAXFikvmce1knCB74c93qLsQNYcgwPVw2EukuX`
- vault:
  `Gjzgqm79p7ehFFhjoUuzfTqB62Sqg7dXUwgouM7vpmXX`
- attempted amount: `2,000,000` kelvins
- recipient before and after: `1,000,000` kelvins
- vault before and after: `2,000,000` kelvins
- current block `8,407,140` exceeded the subscription active range ending at
  `8,404,181`.

The protocol did not record a successful triggered transaction and retained the
one-shot subscription account. No value moved and no success state was stored.
This proves a wrong PDA signature cannot spend the vault, while also revealing
that failed reactive attempts are not returned by the current triggered-
transaction index. Product monitoring must not interpret an absent success
record as execution.

## Gate result

**PASS.** Rialo 0.12.2 supports the required primitive:

`native AFTER -> Venus handler -> PDA-signed system CPI -> exact RLO transfer`.

Scheduled Transfer V2 may now be implemented. Cancellation, refund, replay,
creator authorization, and the execution/cancellation race remain product-
contract work and are not claimed by this probe.
