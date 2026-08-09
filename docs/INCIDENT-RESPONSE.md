# Incident response

1. **Detect and classify:** funds at risk, authorization failure, replay,
   deployment compromise, RPC integrity, frontend compromise, or availability.
2. **Preserve evidence:** commit/deployment IDs, program IDs, signatures, account
   snapshots, logs stripped of secrets, and timestamps.
3. **Contain:** stop new frontend creation if correctness is uncertain; revoke
   compromised web/deployment credentials. Do not replace native execution with
   a keeper and do not silently change program IDs.
4. **Assess on-chain obligations:** identify active workflows, immutable terms,
   vault balances, expected callbacks, and safe creator recovery paths.
5. **Communicate:** state affected network/program/version, impact, safe user
   actions, and evidence. Never describe uncertain transactions as failed or paid.
6. **Recover:** restore a known-good frontend; use only audited on-chain program
   paths; rotate authority according to the documented Rialo mechanism.
7. **Review:** publish root cause, invariant/test gap, remediation, and regression
   evidence before reopening creation.

Real-value launch requires named responders, secure authority custody, external
review contacts, alert delivery, and a tested exercise. Those organizational
controls are not established by this repository alone.

