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

**Step 1 — Actual RLO transfers**
This is the core gap: workflows currently update on-chain *state* but don't move real tokens. Without this, "Scheduled Transfer" doesn't transfer anything. Top priority because it's the product's core value proposition.

**Step 2 — Cancel workflow UI**
Cheap win. Contract-side `cancel` functions already exist per HANDOVER.md — this is a frontend button + call wiring, no contract changes needed.

**Step 3 — Error UX**
Also cheap, frontend-only. Meaningfully improves how the app feels in any demo or review — right now DevNet failures just show perpetual loading states.

**Then reassess, informed by what Steps 1–3 reveal:**

**Step 4 — Investigate the timestamp bug**
Time-box this rather than committing to a fix up front — determine whether `unix_timestamp()` returning 0 is fixable at the Venus/CDK layer or is a DevNet platform limitation. Decide to fix or formally park based on findings.

**Step 5 — More templates (Conditional Swap, Escrow Release)**
Expands product surface area but doesn't address any core gap — sequence after the above so the two live templates are fully solid first.

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
