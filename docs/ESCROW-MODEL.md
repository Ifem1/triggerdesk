# V2 escrow model

This model is not implemented in V1. It is an implementation gate, not a public
product claim.

For workflow `W`, derive a unique program-controlled vault `V` from a domain
separator, `W`, and a recorded bump. Creation and funding must be one transaction.
The creator signs; the instruction creates V2 state, funds principal, verifies
the post-funding vault balance, and registers native subscriptions. Failure of
any leg rolls back all legs.

Definitions:

- `P`: payment principal (`amount` or `amount * payment_count`, checked);
- `R`: minimum account reserve proven from the target Rialo runtime;
- `F`: explicitly quoted execution/network fee funding, if required;
- `D`: principal already delivered;
- `U`: unpaid principal;
- `X`: principal refunded.

Equations:

```text
initial debit = P + R + F
P = D + U + X
scheduled pending: D=0, U=P, X=0
scheduled executed: D=P, U=0, X=0
scheduled refunded: D=0, U=0, X=P
recurring active: D=n*A, U=(N-n)*A, X=0
recurring completed: D=N*A, U=0, X=0
recurring refunded: D=n*A, U=0, X=(N-n)*A
```

Reserve and fee balances must be measured and documented separately. Account
closure may return only the documented residual to the creator after every
subscription is unable to spend. If Rialo cannot explicitly terminate stale
subscriptions, terminal handlers permanently reject them before transfer.

No implementation may assume Solana-compatible signer or reserve behavior merely
because Rialo exposes similarly named APIs. The exact V2 account list, vault PDA
seeds, CPI instruction, `invoke_signed` seeds, callback signer semantics, and
minimum balance must come from generated code/current Rialo sources and a
controlled DevNet deployment.

