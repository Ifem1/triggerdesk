# TriggerDesk — Pure Simulation App

**A no-code conditional execution desk built to simulate Rialo-style automated rule execution.**

Live demo → [triggerdesk.vercel.app](https://triggerdesk.vercel.app)

---

## What Is TriggerDesk?

TriggerDesk is a product simulation that demonstrates one core idea:

> *What if a system could watch for conditions and take action automatically — without you having to do anything manually?*

You define a rule once. The engine watches a feed. The moment the condition becomes true, the action fires. No manual checking. No delays. No emotion.

This build is a **pure local simulation** — no blockchain, no real funds, no private keys. It exists to prove the product logic works cleanly before connecting to live infrastructure.

---

## The Problem It Solves

| Who | Problem |
|---|---|
| **Traders** | Miss their exit price because they're asleep or distracted |
| **Businesses** | Pay invoices late because someone forgot to check |
| **DeFi users** | Get liquidated at 3am because no one was watching |

TriggerDesk removes the human bottleneck. You set the condition. The engine handles the rest.

---

## The Three Core Use Cases

```
IF ETH/USD drops below $3,000     → Sell 20% of position
IF invoice due date = today        → Mark invoice as payable
IF collateral ratio < 130%         → Trigger warning / liquidate
```

One engine. Any condition.

---

## How It Works

```
User creates rule
  → Rule saved as JSON, status: WAITING
  → Mock feed replay emits timestamped events
  → Predicate engine evaluates rule against each event
  → State machine transitions rule status
  → Action simulator updates local state
  → Execution receipt logged to history
  → Toast notification fires on screen
```

### Rule State Lifecycle

| Status | Meaning |
|---|---|
| `WAITING` | Rule is active, watching the feed |
| `ELIGIBLE` | Condition just became true |
| `TRIGGERED` | Engine accepted — executing action |
| `EXECUTED` | Action complete — receipt recorded |
| `FAILED` | Action encountered an error |
| `EXPIRED` | Rule passed its expiry time |
| `CANCELLED` | User cancelled the rule |

---

## Demo Scenarios

| Demo | Feed | Condition | Action |
|---|---|---|---|
| ETH Price Protection | `ETH_USD` | Price < $3,000 | Reduce exposure 20% |
| Invoice Due Date | `INVOICE_DUE_DATE` | Date reached | Mark invoice payable |
| Collateral Warning | `COLLATERAL_RATIO` | Ratio < 130% | Trigger warning |
| Escrow Release | `DELIVERY_STATUS` | Status = confirmed | Unlock escrow |

All replays are deterministic — the same file always produces the same result.

---

## Pages

| Page | Purpose |
|---|---|
| `/` | Landing page — product overview |
| `/dashboard` | Command centre — active rules, live feed, simulated state |
| `/rules/new` | No-code rule builder |
| `/rules/[id]` | Rule detail — state timeline, definition, receipts |
| `/replay` | Play deterministic demo feeds |
| `/history` | Execution receipt log |
| `/architecture` | Simulation vs Rialo-native comparison |
| `/settings` | Reset demo data, configure replay speed |

---

## Core Modules

```
lib/
  simulation/
    predicate-engine.ts    → evaluatePredicate(rule, feedState) → PredicateResult
    state-machine.ts       → transition(rule, event) → TriggerRule
    action-simulator.ts    → simulateAction(rule, appState) → { newState, result }
    sim-store.tsx          → React context — wires all modules with live state
    seed-demo-data.ts      → Default rules and app state for demos
  storage/
    local-store.ts         → localStorage adapter
  types/
    rule.ts                → TriggerRule, RuleStatus, Predicate, ActionType
    execution.ts           → PredicateResult, ExecutionReceipt
    state.ts               → SimulatedAppState (portfolio, invoice, collateral, escrow)
    feed.ts                → FeedEvent, ReplayFile, FeedState

data/
  replays/
    eth-drop-demo.json
    invoice-due-demo.json
    collateral-warning-demo.json
    escrow-release-demo.json
```

---

## Simulation vs Rialo-Native Execution

| Capability | This Build | Future Rialo-Native |
|---|---|---|
| Predicate evaluation | Local TypeScript function | Onchain / keeper network |
| Feed data | Deterministic JSON replay | Chainlink / Pyth live feeds |
| Action execution | Updates local JS state | Signs + broadcasts transaction |
| Rule storage | localStorage | TriggerDeskRegistry.sol |
| Funds moved | None — simulated only | Real assets via smart contract |
| Keeper / automation | setInterval loop | Gelato / Chainlink Automation |
| Receipts | Simulated JSON objects | Onchain transaction receipts |
| Notifications | In-app toast | Email, SMS, Telegram, Webhook |
| Private keys | None required | Backend keeper vault |

---

## Tech Stack

- **Framework** — Next.js 16 (App Router, TypeScript)
- **Styling** — Tailwind CSS v4
- **State** — React Context (no external state library)
- **Storage** — Browser localStorage
- **Tests** — Jest + ts-jest
- **Deployment** — Vercel

---

## Running Locally

```bash
git clone https://github.com/Ifem1/triggerdesk.git
cd triggerdesk
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

To run on a different port:
```bash
npm run dev -- -p 3001
```

---

## Running Tests

```bash
npm test
```

33 tests covering the predicate engine and state machine.

---

## How to Demo

1. Open `/dashboard` — 4 rules are pre-loaded, all `WAITING`
2. Go to `/replay` — select **ETH Drop Protection Demo**
3. Hit **▶ Play** — watch ETH drop from $3,200 → $2,990
4. A toast notification fires the moment the rule executes
5. Return to `/dashboard` — portfolio updated from 10 ETH → 8 ETH active
6. Check `/history` — execution receipt with full audit trail

To reset for a clean run: **Settings → Reset All Demo Data**

---

## What This Is Not

- No smart contracts
- No Sepolia / Base Sepolia deployment
- No Chainlink / Pyth live feeds
- No Gelato / Chainlink Automation
- No backend keeper
- No real wallet or private keys
- No real funds moved

This is a product proof. The onchain execution layer is a separate build.

---

## Future Expansion (Separate Build)

The testnet path would add:

- `TriggerDeskRegistry.sol` — stores rules onchain
- `MockActionVault.sol` — executes actions as real transactions
- `MockPriceFeed.sol` — Chainlink-compatible feed on Sepolia
- Backend private-key keeper — monitors and submits transactions
- Real transaction receipts — txHash, block number, gas used
- Notification layer — Email, WhatsApp, Telegram, Webhook
