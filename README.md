# TriggerDesk — Rialo DevNet evidence demo

TriggerDesk documents and displays verified Rialo-native Scheduled Transfer V2
escrow evidence on DevNet. A V2 workflow funds a PDA-controlled vault; Rialo's
native subscription callback pays the exact principal without a keeper, cron,
browser timer, backend scheduler, or Codespace process.

## Current demo state

The verified V2 program is
`3BA494eLRy15oHN4ST2Fq8Bx231xdPDfJy1tpP7hyoD6`. Its deployed payload and
artifact hash match:
`c010cc54305fdf2a71592639377cd95e781da798a45aa6d8fdc4c10570c840d1`.

The public create controls are deliberately disabled. Stable Venus 0.12.2
generates a `slot..=slot + 100` timer lease and a controlled 5/10/15/20-second
DevNet matrix produced no interval with the required 3/3 autonomous exact
payment result. TriggerDesk does not submit unsupported timers or simulate a
payment. Recurring Allowance is hidden for the same reason.

Verified historical V2 evidence includes exact native payment, creator-only
cancellation/refund, replay boundary and +1/+1000 kelvin surplus hardening.
See [Scheduled V2 evidence](docs/SCHEDULED-TRANSFER-V2-E2E.md) and
[scheduling evidence](docs/SCHEDULING-HORIZON.md).

## Run locally

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The temporary wallet and faucet are DevNet-only;
never use or send real funds.

## Post-demo work

Expose a stable Venus/Rialo timer configuration only after a new release and
controlled 3/3 timing proof. Mainnet, production wallet integration,
independent audit and long-duration scheduling are outside this DevNet demo.
