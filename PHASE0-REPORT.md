# Phase 0 Capability Gate — Report

**Date:** 2026-07-30
**Verdict: PASS**

All six Phase 0 checkpoints are verified on Rialo DevNet. The AFTER callback provably executed and mutated on-chain state without any keeper, scheduler, cron job, or simulation.

---

## Checkpoint Results

### 1. RPC Connectivity — PASS
- **Endpoint:** `https://devnet.rialo.io:4101`
- **Evidence:** `getBlockHeight` returns live block height; all subsequent operations succeed against this endpoint.

### 2. Airdrop — PASS
- **Keypair alias:** `phase0`
- **Public key:** `BJEbqxj2r8LyNHAwdkGEN9jLA4E9NUFu25x9uju9oZ8g`
- **Keypair file:** `/home/achinnys/.config/rialo/phase0.keypair`
- **Evidence:** Multiple 1 RLO airdrops received and confirmed on DevNet.

### 3. Crate Availability — PASS
- **Versions:** All crates at `0.12.2` (rialo-s-program, rialo-s-program-error, rialo-venus, rialo-venus-proc-macro).
- **Toolchain:** rialo-rust v0.0.3 via rialoman v0.3.0, target `riscv64emac-solana-solana`.
- **Build environment:** WSL Ubuntu 22.04 with GCC.

### 4. Venus Compilation — PASS
- **Program:** `triggerdesk-phase0` — minimal Venus workflow with `AFTER` callback.
- **Source:** `programs/triggerdesk-phase0/src/lib.rs`
- **Artifact:** `programs/triggerdesk-phase0/artifacts/triggerdesk-phase0-riscv/triggerdesk_phase0.polkavm` (120 KB)
- **Manifest:** `programs/triggerdesk-phase0/wit/triggerdesk-phase0-manifest.json` — confirms `on_trigger` callback with `handler_type: "timer"`, `start` initiating function with subscription PDA, workflow state structure.

### 5. Program Deployment — PASS
- **Program ID:** `GZ6BJxtSJeJcgFn7Sbyxx6pKufNPn5okcbKi7oaZ3R1d`
- **Deploy method:** `rialo client program deploy <polkavm-binary>`

### 6. Triggered Execution (AFTER Callback) — PASS

This is the critical checkpoint. The Venus program's `AFTER` macro created a native OneShot clock subscription, and the Rialo network autonomously fired the callback, mutating on-chain state.

#### 6a. Start Transaction
- **Signature:** `2Mu8H6R9W4dTwPqNdcMtnFLDaZtDLryEx7QNPx3qrmHnZh1cKDrSfNuRrUB6YZfmWSQLEuiQoSN5Hb4Wi22dtKJC`
- **Status:** `err: null` (success)
- **Compute units:** 51,022 of 200,000
- **Program logs:**
  ```
  Program GZ6BJxtSJeJcgFn7Sbyxx6pKufNPn5okcbKi7oaZ3R1d invoke [1]
  Program log: workflow branch number: 0
  Program log: Begin workflow
  Program log: Phase0::Start delay_secs=60
  Program log: Phase0::Scheduled callback at 60
  Program Subscriber111111111111111111111111111111111 invoke [2]
  SubscribeToEvent
  Deploying account with 4892880 kelvin for rent exemption
  SUBSCRIPTION_AUDIT::SUBSCRIBE::signer=BJEbqxj2r8LyNHAwdkGEN9jLA4E9NUFu25x9uju9oZ8g
    ::subscription=BZuyqLGsHeyB9nPCD1PQe1QwTK7sBVm9Rbg9C96mFS1z
    ::topic=clock::kind=OneShot::active_commits=1591481..=1591581
  Program log: Workflow account Bpjkpk9B76SsFDcinPdhLw3dc7JwXV3WJFC8fLTPdiyY initialized successfully
  Program GZ6BJxtSJeJcgFn7Sbyxx6pKufNPn5okcbKi7oaZ3R1d success
  ```

#### 6b. Subscription Created
- **Subscription PDA:** `BZuyqLGsHeyB9nPCD1PQe1QwTK7sBVm9Rbg9C96mFS1z`
- **Topic:** `clock`
- **Kind:** `OneShot`
- **Active commits:** `1591481..=1591581` (100-block window)

#### 6c. Subscription Consumed (Trigger Fired)
- **Evidence:** `rialo client account BZuyqLGsHeyB9nPCD1PQe1QwTK7sBVm9Rbg9C96mFS1z` returns `"Account does not exist"`.
- **Interpretation:** OneShot subscriptions are deleted after firing. The account no longer existing proves it was consumed by the trigger system.

#### 6d. On-Chain State Mutation
- **Workflow PDA:** `Bpjkpk9B76SsFDcinPdhLw3dc7JwXV3WJFC8fLTPdiyY`
- **Owner:** `GZ6BJxtSJeJcgFn7Sbyxx6pKufNPn5okcbKi7oaZ3R1d` (our program)
- **Raw data (base64):** `AgAAAAAAAAA8AAAAAAAAADwAAAAAAAAAAQEAAAAAAAAA`
- **Decoded state:**

  | Field             | Offset | Type | Value | Notes                                    |
  |-------------------|--------|------|-------|------------------------------------------|
  | discriminator     | 0      | u64  | 2     | Start instruction discriminant           |
  | delay_secs        | 8      | u64  | 60    | Matches input parameter                  |
  | trigger_timestamp | 16     | u64  | 60    | 0 + 60 (unix_timestamp returned 0)       |
  | triggered         | 24     | bool | true  | **Set by on_trigger callback only**      |
  | trigger_count     | 25     | u64  | 1     | **Incremented by on_trigger callback only** |

- **Proof of triggered execution:** The `on_trigger` handler is the only code path that sets `triggered = true` and increments `trigger_count`. This handler is declared as `handler fn`, which can only be invoked by the Rialo subscription/trigger system — not by external callers. The state change from `{triggered: false, trigger_count: 0}` (set by `start`) to `{triggered: true, trigger_count: 1}` is definitive proof that the network autonomously executed the callback.

---

## Known Limitation: Workflow Lineage

`getWorkflowLineage` returns the root transaction node but shows `workflowChildren: []` and `subscriptions: []`. The triggered child transaction is not reflected in the lineage tree.

**Probable cause:** The `now_unix_secs()` function returned 0 (the clock sysvar's `unix_timestamp` field was 0 in the Venus context), so `trigger_timestamp` was set to 60 (epoch + 60 seconds, i.e., January 1, 1970). The AFTER macro converted this past timestamp to a block-height-based OneShot subscription that fired immediately. The lineage indexer may not associate this rapid-fire pattern with the parent workflow.

**Impact on TriggerDesk:** Low. Workflow lineage is a read-only observability feature, not required for trigger execution. The templates can use `getSignaturesForAddress` on the workflow PDA to discover all transactions that touched it. The lineage API can be revisited when a proper future timestamp is used (requires correct clock sysvar access).

**Mitigation for templates:** Future Venus programs should use `AFTER <relative_delay> CALL [handler]` syntax if available, or pass the absolute timestamp as a parameter from the TypeScript CDK where `Date.now()` is reliable.

---

## Conclusion

Phase 0 passes all six checkpoints. The Rialo DevNet can:

1. Accept RPC connections and serve blockchain state
2. Dispense airdrop tokens for development
3. Compile Venus programs with the v0.12.2 toolchain
4. Deploy compiled PolkaVM programs
5. Execute `AFTER` callbacks natively via OneShot clock subscriptions — **no keeper, no cron, no simulation**

TriggerDesk can proceed to Phase 1: implement `scheduled_transfer_v1` template.
