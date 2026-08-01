# TriggerDesk Handover

**Date:** 2026-08-01
**Repo:** https://github.com/Ifem1/triggerdesk
**Branch:** `main` (only branch)
**Latest commit:** `59ab0bc` — Phase 1: Rialo-native MVP

---

## What TriggerDesk Is Now

TriggerDesk started as a pure simulation app (commit `519d136`). It has been transformed into a **genuine Rialo-native automation product** that creates real on-chain workflows using Venus programs and native subscriptions. No simulation, no mock data, no keepers.

Two workflow templates are live on Rialo DevNet:

| Template | Program ID | Status |
|---|---|---|
| Scheduled Transfer | `7BcfcJEJPxatpejoHjbWfPNnEnEsnk3fh1toN4pYCuxh` | Deployed and verified |
| Recurring Allowance | `6TpMo9xFFLYktHhmXzaTkBp2rPTzAuLrk699W7NAW7RZ` | Deployed and verified |

Both templates have been tested end-to-end: creating workflows from the browser UI, submitting transactions to DevNet, and watching native AFTER callbacks fire automatically.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 |
| UI | React + Tailwind CSS | 19.2.4 / v4 |
| Blockchain SDK | @rialo/ts-cdk | 0.12.2 |
| Smart Contract DSL | Venus (Rust proc macro) | 0.3.0 |
| Compilation Target | PolkaVM (RISC-V) | via rialo-rust 0.0.3 |
| Build Environment | WSL Ubuntu 22.04 | GCC + Cargo |
| Language | TypeScript | 5.x |

---

## Repository Structure

```
triggerdesk/
  app/
    api/rpc/route.ts            # RPC proxy (browser -> DevNet)
    dashboard/page.tsx          # Main dashboard with workflow cards
    history/page.tsx            # Workflow execution history
    settings/page.tsx           # Settings page
    workflows/
      [address]/page.tsx        # Workflow detail (auto-detects type)
      new/page.tsx              # New scheduled transfer form
      new-allowance/page.tsx    # New recurring allowance form
  components/
    app-shell.tsx               # Nav bar, wallet connection, airdrop
  lib/rialo/
    client.ts                   # RialoClient singleton (browser uses /api/rpc proxy)
    constants.ts                # Program IDs, status enums, RPC URL
    keypair.ts                  # Ephemeral keypair management (sessionStorage)
    provider.tsx                # React context: wallet, balance, airdrop
    scheduled-transfer.ts       # Create, decode, list scheduled transfers
    recurring-allowance.ts      # Create, decode, list recurring allowances
    types.ts                    # TypeScript interfaces for workflow state
    index.ts                    # Re-exports
  programs/
    triggerdesk-phase0/         # Phase 0 test program (AFTER callback proof)
    scheduled-transfer/         # Venus program: AFTER <time> -> mark claimable
    recurring-allowance/        # Venus program: 3x AFTER -> distribute allowance
      src/lib.rs                # Venus DSL source code
      Cargo.toml                # Rust dependencies (rialo crates 0.12.2)
      artifacts/                # Compiled .polkavm binary (deployed to DevNet)
      wit/                      # Manifest JSON + WIT interface
  PHASE0-REPORT.md              # Phase 0 capability gate evidence
```

---

## Commit History

| Commit | Description |
|---|---|
| `519d136` | Initial build: pure simulation app (localStorage, mock feeds, no blockchain) |
| `b577f26` | README update with full product documentation |
| `59ab0bc` | **Phase 1: Rialo-native MVP** — Venus programs, CDK service layer, real on-chain workflows |

---

## How It Works (End to End)

1. **User connects wallet** — an ephemeral DevNet keypair is generated and stored in sessionStorage (browser tab only, never persisted)
2. **User requests airdrop** — calls `requestAirdropAndConfirm` via the CDK to get DevNet RLO tokens
3. **User fills out a form** — selects template, enters recipient/amount/timing
4. **TypeScript builds the transaction** — derives workflow PDA, subscription PDAs (using `multi_account_slug`), encodes instruction data as bincode
5. **Transaction is signed and submitted** — ephemeral keypair signs, sent via RPC proxy to DevNet
6. **Venus program executes on-chain** — creates workflow PDA, registers AFTER subscriptions with the subscriber interface
7. **Rialo network fires callbacks** — at the scheduled time, the native subscription engine invokes the handler function
8. **Dashboard reads on-chain state** — uses `getAccountsByOwner` to list all workflow PDAs, decodes state from raw bytes

---

## Key Technical Details

### Currency
- 1 RLO = 1,000,000,000 kelvin (the base unit)

### RPC Endpoints
- **HTTP (CLI/server-side):** `http://devnet.rialo.io:4100`
- **HTTPS (client-side fallback):** `https://devnet.rialo.io:4101`
- **Browser:** uses `/api/rpc` proxy route to avoid CORS issues

### PDA Derivation
- **Workflow PDA:** `findProgramAddress(["rialo_workflow", payer_bytes, slug], program_id)`
- **Subscription PDA:** `findProgramAddress(["rialo_subscribe", payer_bytes, multi_account_slug(workflow_pda, branch, index)], subscriber_interface)`
- **Critical:** The `index` parameter in `multi_account_slug` must be the account's position in the instruction accounts array (4, 5, 6...), NOT a 0-based subscription counter. This was a bug that caused `MissingAccount` errors until fixed.

### Venus DSL Constructs
- `AFTER <timestamp> CALL [handler]` — one-shot timer subscription (available in v0.12.2)
- `EVERY` — recurring timer (NOT available as standalone in v0.12.2)
- The recurring allowance works around this by using 3 separate AFTER calls

### CDK Gotchas
- `sendAndConfirmTransaction` returns `{ signature, executed: boolean, err? }` — it does NOT throw on program errors, just returns `executed: false`
- `getAccountsByOwner` returns `[accounts, pagination]` tuple where each entry is `{ pubkey, account: { data, owner, kelvin, ... } }`
- `getAccountInfo` params must be `[{ address: "..." }]` (object), not bare strings

### Well-Known Addresses
- System Program: `11111111111111111111111111111111`
- Subscriber Interface: `Subscriber111111111111111111111111111111111`

---

## Programs Deployed on DevNet

### Phase 0 Test Program
- **ID:** `GZ6BJxtSJeJcgFn7Sbyxx6pKufNPn5okcbKi7oaZ3R1d`
- **Purpose:** Proved that AFTER callbacks work on Rialo DevNet
- **Workflow PDA:** `Bpjkpk9B76SsFDcinPdhLw3dc7JwXV3WJFC8fLTPdiyY` (triggered: true, count: 1)

### Scheduled Transfer
- **ID:** `7BcfcJEJPxatpejoHjbWfPNnEnEsnk3fh1toN4pYCuxh`
- **Source:** `programs/scheduled-transfer/src/lib.rs`
- **Flow:** User schedules a transfer -> AFTER fires at target time -> status changes to Claimable
- **State layout:** discriminator(u64) + recipient(Pubkey) + amountKelvin(u64) + scheduledAt(u64) + createdAt(u64) + status(u8)
- **Statuses:** 0=uninitialized, 1=pending, 2=claimable, 3=claimed, 4=cancelled

### Recurring Allowance
- **ID:** `6TpMo9xFFLYktHhmXzaTkBp2rPTzAuLrk699W7NAW7RZ`
- **Source:** `programs/recurring-allowance/src/lib.rs`
- **Flow:** User creates allowance -> 3 AFTER subscriptions fire at intervals -> each increments distribution count -> status=complete after 3
- **State layout:** discriminator(u64) + recipient(Pubkey) + amountKelvin(u64) + intervalSeconds(u64) + totalDistributed(u64) + distributionCount(u64) + createdAt(u64) + status(u8)
- **Statuses:** 0=uninitialized, 1=active, 2=complete, 3=cancelled

---

## Build Environment (for recompiling Venus programs)

Programs are compiled on WSL Ubuntu 22.04. The toolchain:

```bash
# Install rialo toolchain (if not already installed)
curl -sSf https://rialoman.rialo.io/install.sh | sh
rialoman install 0.12.2

# Compile a program
cd programs/scheduled-transfer
cargo build --release --target riscv64emac-solana-solana

# The compiled binary lands in:
# artifacts/scheduled-transfer-riscv/scheduled_transfer.polkavm

# Deploy to DevNet
rialo client program deploy artifacts/scheduled-transfer-riscv/scheduled_transfer.polkavm
```

The WSL command pattern from Windows:
```bash
wsl -d Ubuntu-22.04 -- bash -c "export PATH='/home/achinnys/.cargo/bin:/home/achinnys/.local/share/rialo/releases/stable/0.12.2/bin:/usr/bin:/usr/local/bin:/bin:\$PATH' && cd /mnt/c/Users/USERpc/trigger\\ desk/programs/scheduled-transfer && cargo build --release --target riscv64emac-solana-solana"
```

---

## GitHub Status

| Item | Status |
|---|---|
| Repo | https://github.com/Ifem1/triggerdesk |
| Branch | `main` (only branch, fully up to date) |
| Latest commit | `59ab0bc` pushed to origin |
| CI/CD | None configured |
| Secrets | None in repo — no .env files, no hardcoded keys |

---

## Vercel Deployment

### Current State
The old simulation app was deployed at `triggerdesk.vercel.app`. After pushing commit `59ab0bc`, Vercel will auto-deploy the new Rialo-native version **if auto-deploy is enabled**.

### What You Need to Do on Vercel

1. **Check deployment status**
   - Go to https://vercel.com/dashboard
   - Find the `triggerdesk` project
   - Check if it auto-deployed from the latest push, or if you need to trigger a redeploy

2. **Build settings** (should already be correct)
   - Framework: Next.js
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm install`

3. **Environment variables**
   - None are required. The app has no secrets — all RPC endpoints are public DevNet URLs hardcoded in the source.

4. **Important: RPC proxy behavior on Vercel**
   - The `/api/rpc` route proxies browser requests to `http://devnet.rialo.io:4100`
   - Vercel serverless functions CAN make outbound HTTP requests, so this should work
   - If the DevNet endpoint is unreliable, the app will show loading states but won't crash
   - The browser client uses `window.location.origin + '/api/rpc'` so it automatically uses the correct domain

5. **If build fails**
   - The `@rialo/ts-cdk` package is in `node_modules` and listed in `package.json` — npm will install it
   - If the npm registry can't find `@rialo/ts-cdk`, you may need to configure an `.npmrc` with the Rialo registry URL
   - Check Vercel build logs for the exact error

6. **Custom domain (optional)**
   - Add your domain in Vercel project settings > Domains

### Vercel Deployment Checklist

- [ ] Confirm auto-deploy triggered from `main` push
- [ ] Check build logs for any errors
- [ ] Open the deployed URL and verify the landing page loads
- [ ] Click "Dashboard" — should show wallet connection UI
- [ ] Click "Airdrop" to get DevNet tokens
- [ ] Create a workflow and verify it submits to DevNet
- [ ] Check the History page shows on-chain data

---

## What Works Right Now

- Landing page with product overview
- Dashboard with real-time on-chain workflow cards
- Create Scheduled Transfer (form -> on-chain transaction -> AFTER callback)
- Create Recurring Allowance (form -> 3 AFTER subscriptions -> auto-distribute)
- Workflow detail page (auto-detects program type from account owner)
- History page (lists all workflows from both programs)
- Ephemeral wallet (connect/disconnect, copy address, airdrop)
- RPC proxy (browser -> DevNet without CORS issues)

---

## Known Limitations

| Issue | Details | Impact |
|---|---|---|
| `unix_timestamp()` returns 0 | Venus clock sysvar reads as 0 on DevNet | Created-at timestamps display as 1970. Functional correctness unaffected — AFTER still fires. |
| No `EVERY` construct | Venus DSL v0.12.2 only has `AFTER` (one-shot) | Recurring allowance uses 3 separate AFTER calls as a workaround. Limited to fixed count. |
| Ephemeral keys only | Keys are generated per browser tab, stored in sessionStorage | No persistent wallet. Keys vanish when tab closes. Fine for DevNet demos. |
| No fund transfer | AFTER callbacks mutate state but don't move RLO between accounts | The programs track distribution amounts but don't execute actual transfers yet. Requires CPI to system_program transfer instruction. |
| DevNet-only | All program IDs and RPC URLs point to DevNet | No mainnet deployment path yet. |

---

## What's Next (Phase 2 candidates)

1. **Actual RLO transfers** — Add CPI to system_program's transfer instruction inside the AFTER handler so tokens actually move
2. **Real wallet integration** — Replace ephemeral keys with browser wallet extension (when available for Rialo)
3. **More templates** — Conditional Swap (ON price_feed), Escrow Release (ON delivery_confirmed)
4. **Cancel workflow UI** — The Venus programs already have `cancel` functions; add a button on the detail page
5. **Proper timestamp display** — Investigate why `unix_timestamp()` returns 0 and fix the created-at display
6. **Persistent EVERY** — When Venus DSL adds standalone `EVERY`, refactor recurring allowance to use it
7. **Error UX** — Show better error messages when DevNet is unreachable or transactions fail

---

## Running Locally

```bash
git clone https://github.com/Ifem1/triggerdesk.git
cd triggerdesk
npm install
npm run dev
```

Open http://localhost:3000 (or use `-p 3001` for a different port).

The app needs internet access to reach `devnet.rialo.io` for RPC calls. Without it, the dashboard will show loading states.

---

## Security Rules (Do Not Break These)

- No private keys, mnemonics, or secrets in source control, env vars, logs, or browser storage beyond sessionStorage
- No external services (Supabase, Firebase, etc.) — the app talks only to Rialo DevNet
- No simulation mode, mock adapters, or fake transaction signatures in the shipped product
- Ephemeral DevNet keys must be clearly labeled as development-only
- If a Rialo capability is missing, report the blocker — never replace it with simulation

---

## Contacts and Accounts

- **GitHub repo owner:** Ifem1
- **DevNet RPC:** `http://devnet.rialo.io:4100` (HTTP) / `https://devnet.rialo.io:4101` (HTTPS)
- **Rialo toolchain installer:** `https://rialoman.rialo.io/install.sh`
