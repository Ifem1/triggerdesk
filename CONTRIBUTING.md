# Contributing

TriggerDesk handles financial workflow logic. Changes must preserve on-chain
compatibility and must not claim value movement without balance-level evidence.

## Development checks

Use Node 24 and the locked dependencies:

```text
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

Contract changes additionally require the pinned Rialo/Venus toolchain,
reproducible PolkaVM builds, manifest review, artifact hashes, adversarial tests,
and DevNet balance-delta evidence before deployment.

Every pull request must describe security impact, state-layout impact, program
address changes, migrations, tests, and user-visible copy changes. Never commit
private keys, mnemonics, deployment credentials, or signed transactions that
contain sensitive material.

## Versioning

The web app follows Semantic Versioning. Contract schemas and deployed program
versions are independent, explicit, and immutable per program ID unless a
documented Rialo upgrade mechanism is deliberately adopted. Breaking state
layouts require a new schema version and compatibility decoder.

