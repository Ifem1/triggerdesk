# Architecture

TriggerDesk is a Next.js client for Rialo DevNet plus independently deployed
Rialo programs. The browser constructs and signs a creation transaction; the
Rialo network stores workflow state and evaluates native subscriptions. No
browser timer or centralized keeper executes callbacks.

V1 callbacks only mutate state. The planned V2 boundary is:

```text
creator signer -> creation + exact vault funding + subscription registration
native Rialo timer -> callback validates immutable state/accounts
                   -> vault transfers exact RLO
                   -> success state commits atomically
creator signer -> cancel validates authority -> unused principal refund
```

Chain state is authoritative. Browser storage in V1 is only a temporary discovery
cache necessitated by the missing creator field; V2 discovery filters versioned
on-chain creator data. The RPC route is a bounded same-origin relay, not a generic
RPC service. DevNet ephemeral keys are experimental and are not a production
wallet architecture.

