# Testing

Local frontend gate:

```text
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm audit --audit-level=high
```

The current unit suite covers checked monetary conversion/overflow and exact V1
account layouts/status decoding. It deliberately does not simulate transfers.

V2 cannot be accepted until pinned-toolchain program tests cover creation,
funding, exact payment, exact refund, authorization, account substitution,
duplicate/out-of-order callbacks, cancel/execution races, insufficient escrow,
malformed state, and u64 boundaries. DevNet E2E is definitive only when recipient
and creator balance deltas prove value movement; state changes alone do not pass.

