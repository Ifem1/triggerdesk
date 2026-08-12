# V2 financial state machines

This is the canonical design for the next program IDs. V1 bytes remain decoded
only as historical DevNet state and must never be interpreted as V2.

## Scheduled Transfer V2

State fields: `schema_version`, `creator`, immutable `recipient`,
`amount_kelvin`, `total_funded_kelvin`, `total_paid_kelvin`,
`total_refunded_kelvin`, `scheduled_at`, `created_at`, `executed_at`, `status`,
`execution_nonce`, workflow bump, and vault bump.

States:

- `UNINITIALIZED`: no valid V2 discriminator/version.
- `PENDING`: fully funded and eligible for exactly one timer execution or creator cancellation.
- `EXECUTED`: recipient transfer committed; no payment principal remains.
- `REFUNDED`: creator cancellation committed; no payment principal remains.

There is no persistent `EXECUTING` state because transaction atomicity must roll
back the transfer and state mutation together. There is no `CLAIMABLE` state
because V2 pays directly.

Allowed transitions: `UNINITIALIZED -> PENDING`, `PENDING -> EXECUTED`, and
`PENDING -> REFUNDED`. All terminal calls fail without moving value.

## Recurring Allowance V2

State fields: `schema_version`, `creator`, immutable `recipient`,
`amount_per_payment_kelvin`, `payment_count`, `payments_completed`,
`total_funded_kelvin`, `total_distributed_kelvin`, `total_refunded_kelvin`,
`interval_seconds`, `next_execution_at`, `created_at`, `completed_at`, `status`,
`next_installment_nonce`, workflow bump, and vault bump.

States: `UNINITIALIZED`, `ACTIVE`, `COMPLETED`, and `REFUNDED`. `PAUSED` is
excluded until a native, fully specified pause/resume mechanism exists.

Each callback is bound to one expected installment nonce. Transfer succeeds
before counters advance. The final successful installment atomically changes
`ACTIVE -> COMPLETED`. Creator cancellation atomically changes `ACTIVE ->
REFUNDED` and returns only unpaid principal.

## Invariants

- Every amount and counter uses checked `u64` arithmetic.
- Creator and recipient are non-default immutable public keys.
- `total_funded = total_distributed + total_refunded + remaining_principal`;
  reserve and execution fees are tracked separately, never hidden in principal.
- Scheduled: `total_distributed` is either zero or exactly `amount_kelvin`.
- Recurring: `total_distributed = payments_completed * amount_per_payment` and
  `payments_completed <= payment_count`.
- A terminal state cannot move funds or change counters.
- Vault, workflow, creator, recipient, system program, subscription, and program
  accounts are validated against stored keys or deterministic derivations.
- One transaction can commit PAY or REFUND, never both. Account write locking
  plus a single `PENDING`/`ACTIVE` precondition makes concurrent attempts
  serializable; the loser observes terminal state and fails.

