# Threat model

Scope: browser, RPC relay, Rialo transactions, workflow/vault accounts,
subscriptions, deployed programs, and deployment authority.

| Threat | Impact | Required mitigation/evidence | Current status |
|---|---|---|---|
| Callback replay or duplicate interval | Double payment | terminal/nonce precondition, atomic transfer+state, adversarial duplicate test | V2 blocked |
| Cancel/execution race | Pay and refund same principal | same writable state/vault, one active-state precondition, concurrent DevNet test | V2 blocked |
| Recipient/vault substitution | Theft | immutable stored recipient and deterministic vault/account validation | V2 blocked |
| Unauthorized cancellation | Theft/denial | creator stored on-chain and required signer equality | V2 blocked |
| Failed transfer counted successful | False accounting | transfer before counters; atomic rollback; forced-failure test | V2 blocked |
| Arithmetic overflow | Underfunding/theft | checked u64 math client and program; boundary tests | client complete; program blocked |
| Malicious RPC | false reads/censorship | signed transactions, executed-result checks, degraded/unknown UI, explorer verification | partial |
| RPC relay abuse/SSRF | cost/outage/internal access | fixed HTTPS origin, allowlist, size/rate/time bounds | implemented |
| XSS steals DevNet session key | account loss | CSP, no HTML injection, no logging; replace with external wallet for production | partial; production blocked |
| Compromised frontend | malicious new transaction | wallet review; immutable existing on-chain terms; published IDs/hashes | V2/wallet blocked |
| Compromised deploy authority | malicious upgrade | immutable IDs or hardware/multisig governance, signed deployment registry | not verified |
| Supply-chain compromise | key/fund loss | lockfiles, audit, Dependabot, CI/SAST/SBOM, reviewed upgrades | partial |
| Stale subscription after terminal state | replay/griefing | explicit termination or permanent terminal no-op plus monitoring | V2 blocked |
| Workflow spam | availability/cost | bounded installment count, creator-paid storage/execution, no global writable account | V2 design |

Residual risk is unacceptable for real value while any V2 funds-path row is
blocked or untested. An independent reviewer must assess implementation and
invariants before production use.

