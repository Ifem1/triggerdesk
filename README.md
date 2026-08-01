# TriggerDesk — Rialo-Native Automation

**Automated on-chain workflows powered by Venus programs and native subscriptions on Rialo DevNet.**

Repo: https://github.com/Ifem1/triggerdesk

---

## What Is TriggerDesk?

TriggerDesk lets you define a workflow once and have it execute automatically on-chain. No keepers, no cron jobs, no off-chain infrastructure.

> Define a rule. Deploy it on-chain. Rialo fires the callback at the right time.

Built on Venus programs (compiled to PolkaVM RISC-V) and Rialo's native subscription engine.

---

## Live Templates

| Template | Program ID | What It Does |
|---|---|---|
| **Scheduled Transfer** | `7BcfcJEJPxatpejoHjbWfPNnEnEsnk3fh1toN4pYCuxh` | Send RLO to any address at a future time. One AFTER callback. |
| **Recurring Allowance** | `6TpMo9xFFLYktHhmXzaTkBp2rPTzAuLrk699W7NAW7RZ` | Distribute a fixed amount 3 times at intervals. Three AFTER callbacks. |

Both are deployed and verified on Rialo DevNet.

---

## How It Works

```
User creates workflow via browser UI
  -> TypeScript CDK builds transaction (PDA derivation, bincode encoding)
  -> Transaction submitted to Rialo DevNet via RPC proxy
  -> Venus program creates workflow PDA + AFTER subscriptions
  -> Rialo network fires callbacks at scheduled times (no keeper)
  -> On-chain state updated automatically
  -> Dashboard reads live state from DevNet
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| UI | React 19 + Tailwind CSS v4 |
| Blockchain SDK | @rialo/ts-cdk 0.12.2 |
| Smart Contracts | Venus DSL (Rust) -> PolkaVM |
| Network | Rialo DevNet |

---

## Pages

| Page | Purpose |
|---|---|
| `/` | Landing page with product overview |
| `/dashboard` | Live dashboard with on-chain workflow cards |
| `/workflows/new` | Create a new scheduled transfer |
| `/workflows/new-allowance` | Create a new recurring allowance |
| `/workflows/[address]` | Workflow detail (auto-detects program type) |
| `/history` | All workflow executions from DevNet |
| `/settings` | App settings |

---

## Running Locally

```bash
git clone https://github.com/Ifem1/triggerdesk.git
cd triggerdesk
npm install
npm run dev
```

Open http://localhost:3000. Requires internet for DevNet RPC access.

---

## Project Structure

```
app/                    # Next.js pages and API routes
  api/rpc/route.ts      # RPC proxy (browser -> DevNet)
  dashboard/            # Main dashboard
  workflows/            # Workflow creation and detail pages
  history/              # Execution history
lib/rialo/              # TypeScript CDK service layer
  client.ts             # RialoClient singleton
  scheduled-transfer.ts # Scheduled transfer operations
  recurring-allowance.ts# Recurring allowance operations
  provider.tsx          # React context for wallet state
  keypair.ts            # Ephemeral key management
programs/               # Venus programs (Rust source + compiled PolkaVM)
  scheduled-transfer/   # AFTER <time> -> mark claimable
  recurring-allowance/  # 3x AFTER -> distribute allowance
  triggerdesk-phase0/   # Phase 0 proof-of-concept
```

---

## Documentation

- **[HANDOVER.md](HANDOVER.md)** — Full technical handover with deployment instructions, Vercel setup, known issues, and what's next
- **[PHASE0-REPORT.md](PHASE0-REPORT.md)** — Phase 0 capability gate evidence proving AFTER callbacks work on DevNet
