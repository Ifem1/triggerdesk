# TriggerDesk completion audit

Audit date: 2026-08-09  
Baseline: `6a76dfd7fd88dddd4a93d59279bd99f77ea49ca0`  
Audited local head: `98144d7` plus this audit commit

## Verdict

> Update after the original audit: Scheduled Transfer V2 now has a distinct
> deployed DevNet program, exact artifact/deployed-payload hash equality, real
> escrow funding, native AFTER payment, replay rejection, native subscription
> cancellation, exact refund, and idempotent repeat cancellation. See
> `docs/SCHEDULED-TRANSFER-V2-E2E.md`. Recurring Allowance V2, general-duration
> scheduling, product integration, and the remaining production gates are still
> incomplete, so TriggerDesk is not yet finished or production-ready.

TriggerDesk is a truthful, substantially hardened Rialo DevNet native-callback
prototype. It is **not** an autonomous payment product, 10/10 DevNet financial
product, production-ready product, or mainnet-ready product. The decisive target
remains unproved: V1 does not escrow or transfer RLO, cannot expose a verified
cancel instruction, and has no recipient/refund balance-delta E2E evidence.

## Completed with evidence

- Fresh baseline SHA and tool versions recorded.
- Locked install, lint, typecheck, unit tests, and Next production build pass.
- Retired simulator tests removed; current V1 layouts and security-critical money
  utilities tested.
- Exact decimal-to-Kelvin bigint conversion rejects zero, precision loss, unsafe
  syntax, and u64 overflow.
- Public/runtime copy explicitly states V1 callbacks do not move RLO.
- Configured DevNet program accounts are executable RISC-V loader accounts.
- Deployed program payload hashes exactly match checked-in PolkaVM artifacts.
- V1 cancellation was audited without guessing: it is absent from both manifests
  and deployed instruction enums.
- V2 authority, immutable recipient, lifecycle, escrow equations, terminal-state,
  idempotency, and cancel/execution race invariants are specified.
- V1 decoders reject truncated accounts and unknown statuses.
- RPC relay has a fixed HTTPS upstream, JSON-RPC validation, method allowlist,
  batch denial, size bounds, best-effort in-process rate limiting, timeout,
  sanitized errors, and secret-safe metadata logging.
- CSP and baseline browser security headers are configured.
- Next.js security update applied; npm audit reports zero known vulnerabilities.
- Verified DevNet registry fails closed for unconfigured networks.
- CI definition, Dependabot, CODEOWNERS, contribution/security policy, deployment
  registry, health endpoint, threat model, operations and incident runbooks exist.

## Remaining implementation

- Compile V2 programs with a supported pinned Rialo toolchain.
- Add schema version and creator to deployed state without mis-decoding V1.
- Implement atomic vault creation/funding and prove reserve/fee accounting.
- Implement exact scheduled transfer and recurring installment transfers.
- Implement creator-only cancel, exact full/partial refunds, and subscription cleanup.
- Prove recipient/vault/system/subscription account substitution fails.
- Prove duplicate callback and cancel/execution races cannot double-spend.
- Replace browser-local ownership authority with V2 on-chain creator discovery and
  pagination.
- Add normalized transaction receipts, unknown-confirmation recovery, browser E2E,
  failure injection, accessibility audit, performance/load tests, and callback
  monitoring.
- Protect `main`, run CI on the pushed commits, add CodeQL/secret/SBOM/Rust policy,
  and establish release/deployment signing and rollback evidence.
- Obtain an independent contract audit, production wallet, staging soak, legal
  review, operational ownership, and verified production Rialo network.

## External and Rialo blockers

### Current Rialo/Venus funds-path verification

Missing proof: Venus 0.12.2 generated handlers have not yet been shown to expose the
explicit account context and PDA signer path required for safe vault-to-recipient
native transfers and partial refunds. Lower-level Rialo 0.12.2 documentation does
expose CPI and `invoke_signed`, so this is not claimed to prove that Rialo can
never support the design. It blocks implementation until the generated interface
or official raw-program pattern is compiled and inspected.

Tested: V1 source, WIT, manifests, deployed executable bytes, installed TypeScript
CDK source, published Rialo crate documentation, DevNet accounts, and documented
toolchain installation path. The Windows machine has no Rust/Cargo, WSL, or
Docker, which is now treated only as a workstation limitation. A persistent
Ubuntu bootstrap and official 0.12.2 source-build fallback are checked in; remote
execution is pending. The obsolete `rialoman.rialo.io` host failed DNS, while
current official rialoman documentation points to Rialo's S3 installer.

Remaining when available: compile expanded code, define exact account lists and
PDA seeds, add V2 implementations/tests, deploy new program IDs, then run balance
E2E and races. No guessed instruction, browser cron, keeper, mock transfer, or
state-only payment substitute was introduced.

### Production Rialo capability

Official production/mainnet availability, production wallet/signing integration,
fee/reserve semantics, explorer, deployment/upgrade process, and escalation path
have not been verified. These are `BLOCKED BY RIALO` gates for production claims.

### Organizational gates

Independent review, legal/privacy assessment, hardware/multisig authority,
branch-protection settings, hosted monitoring/alerts, staging and production
deployments require repository-owner or third-party action and cannot be proven
by local code.

## Validation results

| Check | Result |
|---|---|
| `npm ci` | Pass; 642 packages installed |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test -- --runInBand` | Pass; 4 suites, 26 tests |
| `npm run build` | Pass; Next.js 16.3.0, 12 routes including health/RPC |
| `npm audit --audit-level=high` | Pass; zero known vulnerabilities |
| Venus/Rust source build | Pending on persistent Ubuntu; reproducible bootstrap prepared |
| Generated V2 manifests | Not produced |
| DevNet V2 deployment/E2E | Not performed |

## Deployed program and artifact evidence

| Program | Program ID | Artifact/deployed payload SHA-256 |
|---|---|---|
| Scheduled Transfer V1 | `7BcfcJEJPxatpejoHjbWfPNnEnEsnk3fh1toN4pYCuxh` | `F0EDE60DCD4471C0F1961CCA76AD7D04E822FD727A0FC72B4425B563A89D256A` |
| Recurring Allowance V1 | `6TpMo9xFFLYktHhmXzaTkBp2rPTzAuLrk699W7NAW7RZ` | `C8BCDC706730AEB5DD1CB912124BC951C2BD5CC7443266E290AD43148C5C15BB` |

The loader account adds a 48-byte header; hashing the remaining payload exactly
matches each checked-in artifact. Deployment transaction IDs are absent from the
repository and remain unknown.

## DevNet E2E evidence

Evidence proves deployed executable identity and that the V1 architecture uses
native subscriptions/state callbacks. It does **not** show escrow funding,
recipient balance increases, cancellation, or refunds. Therefore Scheduled
Transfer and Recurring Allowance payment E2E are failed/unmet, not inferred from
callback counters.

## Security status

Frontend/RPC baseline: materially hardened. Dependency audit: clean. Financial
contract security: unverified and unsuitable for funds. The ephemeral key remains
page-accessible in session storage and is permitted only for explicit DevNet use.
There is no independent audit or secured deployment-authority evidence.

## CI/CD status

The repository contains frontend build/test/audit CI and dependency update
configuration. Local commits are four-plus commits ahead of `origin/main`, so no
remote run proves these exact commits green. Rust/Venus, browser E2E, DevNet E2E,
CodeQL, secret scanning, SBOM, signed release, deployment, and branch protection
are not complete.

## Production-readiness scorecard

| Category | Score | Primary reason below 10 |
|---|---:|---|
| Rialo-native architecture | 7/10 | Native V1 callbacks proven; autonomous value path unproved |
| Smart-contract correctness | 2/10 | V1 bookkeeping only; no V2 compile/adversarial suite |
| Funds/escrow safety | 0/10 | No escrow or transfer implementation |
| Scheduled Transfer | 2/10 | Timer/state callback only; no payment/cancel/refund |
| Recurring Allowance | 2/10 | Counters only; no installments/refund |
| Authorization/cancellation/refunds | 0/10 | Creator absent; cancel not externally exposed |
| Replay/race safety | 1/10 | Invariants specified but not implemented/tested on-chain |
| Wallet/signing | 2/10 | DevNet ephemeral session key only |
| TypeScript/CDK layer | 6/10 | Exact money/network/decoding improved; manual encoding and receipt gaps |
| RPC/backend | 7/10 | Hardened boundary; in-memory rate limit and hosted telemetry remain |
| Chain discovery/indexing | 2/10 | V1 browser-local ownership cache; no on-chain creator/pagination proof |
| Testing | 4/10 | 26 local tests; no contract/browser/DevNet balance/adversarial suite |
| Security | 5/10 | Headers/audit/threat model; funds path, key model and external audit missing |
| CI/CD | 4/10 | Workflow defined but exact commits not remotely run; major jobs absent |
| Reliability/observability | 4/10 | Health/runbooks exist; no hosted alerts or callback monitor |
| UI/UX | 5/10 | Truthful basic lifecycle; receipts/confirmation/recovery incomplete |
| Accessibility | 2/10 | No axe/manual WCAG 2.2 AA evidence |
| Performance | 2/10 | Build passes; no bundle/load/Core Web Vitals evidence |
| Documentation/product honesty | 8/10 | Core truth/blockers documented; full user/release docs remain |
| Release/deployment | 3/10 | Registry/hashes exist; no verified pipeline, authority or rollback deployment |
| Mainnet readiness | 0/10 | Official production capability and all financial gates unverified |

Overall: **3.3/10 production readiness**. A DevNet native-automation prototype
score is higher, but it cannot be called a completed financial product until the
funds-path acceptance tests pass.
