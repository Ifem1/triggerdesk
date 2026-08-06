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

**Complexity:** Genuinely low — the most mechanical of the five, assuming the contract-side function is solid. Mostly UI wiring + a confirmation dialog (destructive action, should confirm before firing).

**Dependency note:** If Step 1 isn't done first, "cancel" only cancels the bookkeeping, not any actual escrowed funds — worth flagging to users so it's not misleading.

### Step 3 — Error UX

Also cheap, frontend-only. Meaningfully improves how the app feels in any demo or review — right now DevNet failures just show perpetual loading states, per HANDOVER.md.

**What needs to happen:**
- Add real error boundaries / states to the data-fetching hooks in `lib/rialo/provider.tsx` and wherever `getAccountsByOwner`/`getAccountInfo` calls happen — distinguish "still loading" from "failed after N retries."
- Surface specific failure modes distinctly:
  - RPC unreachable → "Can't reach Rialo DevNet — check your connection"
  - Transaction submitted but `executed: false` (per the CDK gotcha noted in HANDOVER.md — this does NOT throw, it just returns a flag) → needs explicit handling wherever `sendAndConfirmTransaction` is called, or failed transactions will silently look like they succeeded
  - Airdrop failure (DevNet faucet rate-limited or down) → explicit message, not a silent no-op

**Complexity:** Low-medium. The UI itself (toast/banner components) is easy — the real work is **auditing every call site** that touches the CDK to make sure `executed: false` and thrown/rejected promises are both actually caught and surfaced, since the HANDOVER.md gotcha suggests this was already a source of silent failures.

**Sequencing note:** worth doing early — it's cheap and directly affects whether bugs introduced in Step 1 get caught during testing or silently swallowed.

**Then reassess, informed by what Steps 1–3 reveal:**

### Step 4 — Investigate the timestamp bug

Time-box this rather than committing to a fix up front — determine whether `unix_timestamp()` returning 0 is fixable at the Venus/CDK layer or is a DevNet platform limitation. Decide to fix or formally park based on findings.

**What "investigate" actually means, concretely:**
- Check whether this is a known Rialo DevNet issue (Rialo's dev community/Discord/docs, or their GitHub issues) — if it's a platform-side clock sysvar bug, there's nothing to fix locally.
- If not platform-side, check whether the Venus DSL's `unix_timestamp()` call is being invoked correctly, or whether there's a manifest/ABI issue in how the program reads the clock sysvar.
- Low-effort alternative that sidesteps the investigation entirely: have the **frontend capture and display the timestamp client-side** at transaction-submission time, instead of relying on the on-chain sysvar for display purposes. Doesn't fix the root cause, but makes the UI show correct dates regardless.

**Recommendation:** don't sink real time into root-causing a DevNet platform quirk. The frontend workaround is probably a 30-minute fix that makes the symptom disappear, versus an open-ended investigation into someone else's infrastructure. Default to the workaround unless there's a specific reason to want the root cause.

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
