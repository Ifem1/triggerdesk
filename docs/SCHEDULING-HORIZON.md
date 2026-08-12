# Scheduled Transfer V2 timing evidence

TriggerDesk uses Rialo native one-shot subscriptions. No browser, backend,
Codespace process, cron job, or keeper executes a payment after creation.

## Stable Venus 0.12.2 limitation

The installed `rialo-venus-dsl` 0.12.2 time transformer emits
`active_commits = slot..=slot + 100`. The public Rialo Subscriber API accepts
an arbitrary inclusive active-commit range, but this stable Venus interface does
not expose that setting. A direct native-subscription probe could not safely
reuse Venus's generated callback ABI and was reverted.

## Live DevNet matrices

The earlier 30 s, 1 m, 2 m, 3 m, 5 m and 10 m workflows all remained funded
and subscribed after their due times. The controlled short-window matrix on
2026-08-12 used program `3BA494eLRy15oHN4ST2Fq8Bx231xdPDfJy1tpP7hyoD6`,
creator `Csgoy8TnEp7kZk8STr9gK8bPyLkUG6sVJhWYni2Xmwom`, recipient
`3t9AHak5yop4MQPrpEWfaSmwVK1EMfEMzpfofAT1L7Kb`, and principal 1,000,000
kelvin per workflow.

| Delay | Runs | Result | Recipient delta |
| --- | --- | --- | ---: |
| 5 seconds | 3 | 0/3 callbacks | 0 |
| 10 seconds | 3 | 0/3 callbacks | 0 |
| 15 seconds | 3 | 0/3 callbacks | 0 |
| 20 seconds | 3 | 0/3 callbacks | 0 |

All twelve recipient observations remained at 47,000,000 kelvin. Workflows,
vaults and subscriptions remained present, so no terminal callback occurred.
Representative create transactions: 5-second `4S7VW2cmLJqFXBVDRjcg2Ja6gAttcd2FnH6gX6Gcpjjz3mDYpnUqgu8KKjTGdWXhYE7Mrt71MhVsH64KhCMEvABb`,
10-second `4nbYHLahLmD4ca3QNABjpZB1FvhDqxWLfPRmxiTdX1xBib2qj9MYpJXuLCpFSFopsn463NMpH4DbJS7ovFvmKmd3`,
15-second `4C5mPP197TwsCWkbPwZygWRevGwXWKY8kp64MPFTooE6xEAUQ14XASH1w91WwL7EbacZ9E7cQcqJRg7DZzaQ5iFo`,
20-second `5xZ2kbEQDqrV62fZiYJKVqiNyy8LrFGhbjvVCAvhS7gByq1CaSZch64M7YpLjgbXova9WWkWq9LzCDwgZYovBC5n`.

## Demo decision

No interval achieved the required 3/3 autonomous exact-payment result. The
public Scheduled Transfer and Recurring Allowance creation paths are therefore
disabled. This is intentional fail-closed behavior, not a simulated workflow.
The verified V2 escrow, native payment, cancellation, replay and surplus proof
remain available in `docs/SCHEDULED-TRANSFER-V2-E2E.md`.
