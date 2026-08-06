# TriggerDesk — Phase 2 Plan

**Date:** 2026-08-06
**Status:** Draft — for discussion, not yet started
**Follows on from:** [HANDOVER.md](HANDOVER.md) — "What's Next (Phase 2 candidates)"

---

## Where Phase 1 left off

Phase 1 shipped a genuine Rialo-native MVP: two live templates (Scheduled Transfer, Recurring Allowance) with real on-chain workflows, Venus programs deployed to DevNet, and a working browser UI reading/writing live chain state. See HANDOVER.md for full details.

The known gaps left open at the end of Phase 1 are the starting point for this plan.

---

## Candidate items (from HANDOVER.md), assessed

| # | Item | Complexity | Blocked? |
|---|---|---|---|
| 1 | Actual RLO transfers (CPI to `system_program` transfer inside the AFTER handler) | Medium — Rust/Venus contract change | No |
| 2 | Cancel workflow UI (contract `cancel` functions already exist) | Low — mostly frontend | No |
| 3 | Error UX (DevNet unreachable / transaction failures) | Low–Medium — frontend | No |
| 4 | Proper timestamp display (`unix_timestamp()` returns 0 on DevNet) | Unknown | Possibly — may be a Rialo/Venus platform limitation, needs investigation before committing time |
| 5 | Real wallet integration (replace ephemeral keys) | N/A | Yes — no browser wallet extension exists for Rialo yet |
| 6 | More templates (Conditional Swap, Escrow Release) | Medium–High — new Venus program per template | No |
| 7 | Persistent `EVERY` construct (replace 3x-`AFTER` workaround) | N/A | Yes — depends on a future Venus DSL language feature outside our control |

---

## Recommended sequencing

### Step 1 — Actual RLO transfers

This is the core gap: workflows currently update on-chain *state* but don't move real tokens. Without this, "Scheduled Transfer" doesn't transfer anything. Top priority because it's the product's core value proposition.

**What needs to happen:**
- Inside the Venus program's AFTER handler, add a **CPI (Cross-Program Invocation)** call to the System Program's `transfer` instruction — moving `amountKelvin` from the workflow's escrow-holding PDA (or the payer, depending on design) to `recipient`.
- This requires the workflow PDA to actually **hold funds** at creation time — needs checking whether `createScheduledTransfer` currently deposits RLO into the PDA at creation. If not, step 0 is adding a deposit instruction so there's something to transfer later.
- PDA signing: a program-derived account can't sign like a normal keypair — the CPI needs the workflow PDA's seeds passed as signer seeds so the runtime can authorize the transfer on the program's behalf. Standard Solana-style PDA-signed CPI, likely similar in Rialo/Venus.
- For Recurring Allowance: same idea, but 3 separate transfers, one per AFTER firing, each moving `amountKelvin` from escrow to recipient.

**Risk/complexity:** Medium-high, not low — not just "add a transfer call." It touches fund custody (rent-exemption on the PDA, escrow deposit flow, signer seed handling), and a bug here means funds could get stuck in a PDA nobody can withdraw from. Worth careful line-by-line review and DevNet testing with small amounts before calling it done.

**Testing implication:** Needs an end-to-end DevNet test — create workflow with deposit, wait for AFTER, verify recipient balance actually increased, not just that status flipped.

### Step 2 — Cancel workflow UI

Cheap win. Contract-side `cancel` functions already exist per HANDOVER.md — this is a frontend button + call wiring, no contract changes needed.

**What needs to happen:**
- Add a `cancelScheduledTransfer` / `cancelRecurringAllowance` function in `lib/rialo/` (mirroring the existing `create*` functions) — builds and submits the cancel transaction.
- Add a "Cancel" button on the workflow detail page (`app/workflows/[address]/page.tsx`), visible only when status is cancellable (e.g. `pending`/`active`, not already `claimed`/`complete`/`cancelled`).
- Handle the on-chain effect: does `cancel` return escrowed funds to the creator? If Step 1 isn't done yet, cancel just flips status — decide whether that's acceptable in the interim or whether cancel should be sequenced *after* Step 1 so it also handles refunding real held funds correctly.

**Complexity:** Originally assessed as low. **Correction after investigation (2026-08-07): this is not frontend-only.** Checked both compiled manifests (`programs/scheduled-transfer/wit/scheduled-transfer-manifest.json`, `programs/recurring-allowance/wit/recurring-allowance-manifest.json`) against `lib.rs` — `cancel` is a real `terminating fn` in both programs' Rust source, but **neither manifest lists an instruction entry for it**. Only `get_state` (enum_variant 0), the AFTER/timer callback (enum_variant 1), and `schedule`/`setup` (enum_variant 2) are documented as callable instructions. Confirmed via git history that the manifest and `lib.rs` were committed together in `59ab0bc` — this isn't a stale-manifest-lagging-behind-source issue, the manifest generator itself didn't emit an instruction for `cancel`.

This means there is no reliable evidence `cancel` is actually callable on the currently deployed program binaries. Building a "Cancel" button would require guessing an instruction discriminant/encoding and firing it at a live (DevNet) program — not something to do without verification, since a wrong instruction could be rejected or, worse, silently hit an unintended code path.

**Revised path:** Step 2 now converges with Step 1 — both need the WSL/Rust/Cargo toolchain to (a) confirm whether `cancel` compiles into a real instruction and regenerate the manifest, or (b) if it doesn't, add proper instruction wiring to `lib.rs` and redeploy. Not plannable as a quick frontend win until that investigation happens.

**Dependency note:** If Step 1 isn't done first, "cancel" (once actually wired) only cancels the bookkeeping, not any actual escrowed funds — worth flagging to users so it's not misleading.

### Step 3 — Error UX ✅ Done (2026-08-07)

Also cheap, frontend-only. Meaningfully improves how the app feels in any demo or review — right now DevNet failures just show perpetual loading states, per HANDOVER.md.

**What needs to happen:**
- Add real error boundaries / states to the data-fetching hooks in `lib/rialo/provider.tsx` and wherever `getAccountsByOwner`/`getAccountInfo` calls happen — distinguish "still loading" from "failed after N retries."
- Surface specific failure modes distinctly:
  - RPC unreachable → "Can't reach Rialo DevNet — check your connection"
  - Transaction submitted but `executed: false` (per the CDK gotcha noted in HANDOVER.md — this does NOT throw, it just returns a flag) → needs explicit handling wherever `sendAndConfirmTransaction` is called, or failed transactions will silently look like they succeeded
  - Airdrop failure (DevNet faucet rate-limited or down) → explicit message, not a silent no-op

**Complexity:** Low-medium. The UI itself (toast/banner components) is easy — the real work is **auditing every call site** that touches the CDK to make sure `executed: false` and thrown/rejected promises are both actually caught and surfaced, since the HANDOVER.md gotcha suggests this was already a source of silent failures.

**Sequencing note:** worth doing early — it's cheap and directly affects whether bugs introduced in Step 1 get caught during testing or silently swallowed.

**Implemented (2026-08-07):**
- `RialoProvider.requestAirdrop` now catches failures instead of throwing uncaught — exposes `airdropStatus` (`idle`/`pending`/`success`/`error`) and `airdropError` via context. Rate-limit errors get a friendly message; other failures show the raw error.
- `WalletButton` (nav) surfaces airdrop pending/error state directly on the button plus an inline error popover.
- Dashboard and History pages now distinguish "genuinely zero workflows" from "can't reach DevNet" — `listWorkflows`/`listAllowanceWorkflows` swallow errors internally and return `[]`, so the real signal is `connectionStatus === 'error'` (already tracked centrally in the provider via periodic `getBlockHeight()` polling). Both pages now show a distinct red "Can't reach Rialo DevNet" banner instead of a misleading "No workflows found" empty state when that's the case.
- The `executed: false` / thrown-error handling in `createScheduledTransfer` and `createRecurringAllowance` was already correct (throws with the on-chain error detail) and the `new workflow` forms already catch and display it — audited, no changes needed there.

**Not done:** deeper retry/backoff logic for transient RPC blips — current behavior is "fail visibly, let the user hit Refresh," which is enough for a DevNet app at this stage.

### Step 4 — Timestamp bug ✅ Done (2026-08-07), via workaround, not root-cause fix

**What was actually done:** implemented the frontend workaround recommended above rather than the platform investigation — didn't sink time into root-causing Rialo DevNet's clock sysvar behavior. Added `lib/rialo/client-timestamps.ts`: captures `Date.now()` client-side at the moment a workflow is submitted, keyed by workflow PDA address, stored in `localStorage`. `createScheduledTransfer` and `createRecurringAllowance` both now call `saveClientCreatedAt()` right after a successful submission. The workflow detail page's "Created" field (Recurring Allowance only — Scheduled Transfer's detail view doesn't display a created-at field, only Scheduled At) now calls `resolveCreatedAt()`, which prefers the on-chain timestamp when it's non-zero and falls back to the locally-captured value, or a clear "Unknown (created in another browser)" label if neither is available.

**Known limitation of the workaround (by design, documented in the module):** display-only, lost if `localStorage` is cleared or the workflow is viewed from a different browser/session than the one that created it. Acceptable tradeoff for a cosmetic field — doesn't touch on-chain state or correctness.

**Original investigation (whether `unix_timestamp()` returning 0 is a Venus/CDK bug or DevNet platform limitation) was not performed** — parked, since the workaround fully resolves the user-visible symptom without it.

### Step 5 — More templates (Conditional Swap, Escrow Release)

Expands product surface area but doesn't address any core gap — sequence after the above so the two live templates are fully solid first. Both are currently marked "COMING" on the landing page with no Venus program behind either.

**Conditional Swap** (`ON price_feed(ETH < 3000) -> SWAP 1 ETH to stablecoin`):
- Needs a **price oracle** — this is the hard part. Does Rialo have a native price feed construct in the Venus DSL (the `ON price_feed(...)` syntax already shown in the landing page copy suggests the DSL may support this natively)? If yes, this is "just" a new Venus program using `ON` instead of `AFTER`. If the DSL doesn't actually have this yet, it's fully blocked, same as the `EVERY` construct issue.
- Also needs an actual swap mechanism — is there a DEX/AMM on Rialo DevNet to swap against, or does "swap" mean something more primitive at this stage? Needs clarifying before scoping.

**Escrow Release** (`ON delivery_confirmed -> RELEASE escrow funds`):
- `delivery_confirmed` implies an oracle or external attestation mechanism — something needs to write "delivery confirmed" on-chain for the `ON` trigger to fire against. Is that a manual admin call, a third-party integration, or fully out of scope for a DevNet demo? This is a product-design question before it's an engineering one: who/what confirms delivery?
- Once that's defined, the on-chain mechanics (hold funds in PDA, release on trigger) mirror the transfer logic from Step 1.

**Assessment:** both are **higher-risk and more open-ended than they look** from the landing page copy — Conditional Swap needs price-feed infrastructure that may not exist yet on Rialo DevNet, and Escrow Release needs a defined "who attests delivery" answer before any code gets written. Recommend treating both as **discovery spikes first** (a day of research: does Rialo DevNet support `ON price_feed`? Is there a DEX to swap against? What's the intended escrow attestation model?) rather than committing to build them outright. If discovery reveals real blockers, it may be more honest to relabel them "future" on the landing page than "coming" until there's a concrete plan.

**Parked (not plannable right now):**
- **Real wallet integration** — blocked on a Rialo wallet extension that doesn't exist yet. Revisit when/if one ships.
- **Persistent `EVERY`** — blocked on a Venus DSL feature outside our control. Revisit if/when the DSL adds it.

---

## Open questions for discussion

- Priority check: does real fund movement (Step 1) need to happen before any public demo/sharing of the app, or is the current state-only version acceptable for now?
- Any timeline/deadline driving this, or is Phase 2 open-ended?
- Should Step 6 (more templates) include Conditional Swap AND Escrow Release, or just one first as a proof of the templating pattern before building both?

---

*No implementation work has started on any of the above. This document is a planning reference only.*
