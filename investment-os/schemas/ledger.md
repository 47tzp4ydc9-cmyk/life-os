# Schema: ledger

One file per **account**. Append-only log of every executed fill in that account — the source of truth for what you actually traded, hold, and realized.

**Path:** `narrative/ledger/<account>.md` (one file per account slug from [`_shared/accounts.md`](../../_shared/accounts.md)).

Partitioning: keep one file per account until it exceeds ~2000 executions or feels slow to read. Then split by year: `<account>-2024.md`, `<account>-2025.md`, and so on. The latest year keeps the bare `<account>.md` filename.

## Why this file exists

`narrative/decisions/` records the **reasoning** behind significant actions. The ledger records every **fill** that hit the account — including dividends, fees, assignments, expirations, and small adjustments that don't warrant a decision file. This is what your future self (and the dashboard) reads to compute realized P&L and historical position size.

`data/portfolio.db` is a **derived cache** — scripts project this ledger plus live broker data into SQL for fast querying. The ledger is the source; the DB is regeneratable.

## Frontmatter

```yaml
---
type: ledger
account: ibkr_margin            # slug from _shared/accounts.md
person: jatan                   # slug from _shared/accounts.md
status: active                  # active | closed
opened: 2020-01-15              # account opening date if known, else null
last_synced_at: 2026-06-28T15:00:00Z   # ISO datetime; sync prompt updates this
sources_used: [ibkr, gmail]     # informational: which connectors fed this file
executions:
  - id: ibkr:exec:0001A2B3      # stable unique key (see "Idempotency" below)
    date: 2026-06-25            # trade date (YYYY-MM-DD)
    action: short_close         # see "Actions" enum below
    instrument: option          # us_stock | cdr | etf | option | crypto | cash
    symbol: RKLB                # ticker or option underlying
    quantity: 1                 # ALWAYS positive; sign comes from action
    price: 24.72                # per share for stock; per share per contract for option
    currency: USD               # currency of price/fees/net_cash
    fees: 1.45                  # total commission + reg fees in execution currency
    net_cash: -2473.45          # signed; positive = cash IN, negative = cash OUT; null if unknown
    broker_order_ref: "ibkr:102"   # joins to decisions[].broker_order_ref when known
    fill_ref: "ibkr:exec:0001A2B3" # most granular id from the broker, when available
    option:                     # only when instrument: option
      right: put                # put | call
      side: short               # short | long
      strike: 105
      expiry: 2026-07-10
    related_id: null            # id of a paired execution (assignment leg, roll leg, etc.)
    decision_ref: decisions/2026-06-25-rklb-roll.md   # back-link if a decision exists
    source: ibkr                # ibkr | gmail | manual
    imported_at: 2026-06-28T15:00:00Z
    notes: null
---
```

## Body

A one-paragraph orientation. All structure lives in frontmatter. Example:

```markdown
# IBKR Margin — execution ledger

Append-only log of every fill in this account. Synced from the IBKR connector and Gmail broker confirmations via [`investment-os/prompts/sync-executions.md`](../../prompts/sync-executions.md). The dashboard reads this file to compute realized P&L and historical position size.
```

## Actions

Use exactly one of these in `action:`. The sign convention for `net_cash` follows from the action.

| Action | Meaning | Typical sign of `net_cash` |
|---|---|---|
| `buy` | open or add to a long equity position | negative |
| `sell` | reduce or close a long equity position | positive |
| `short_open` | open or add to a short equity position (or sell-to-open an option) | positive |
| `short_close` | reduce or close a short position (or buy-to-close an option) | negative |
| `assign_long` | a long option you held was exercised, giving you stock | depends |
| `assign_short` | a short option you sold was assigned against you | depends |
| `exercise_long` | you exercised a long option | depends |
| `exercise_short` | counterparty exercised against you (same as `assign_short` for most brokers) | depends |
| `expire_long` | long option expired worthless | 0 |
| `expire_short` | short option expired worthless (you keep the premium) | 0 |
| `dividend` | cash dividend received | positive |
| `interest` | margin or cash interest credit/debit | either |
| `fee` | standalone fee or adjustment | usually negative |
| `transfer_in` / `transfer_out` | cash or shares moved in/out of the account | either |
| `other` | corp action, journal entry, anything not covered above — explain in `notes` | either |

A roll is **two executions**: one `short_close` (BTC the near leg) and one `short_open` (STO the far leg), linked via `related_id`. The matching decision file in `narrative/decisions/` describes the reasoning; the ledger records the two fills.

## Idempotency — the `id` field

`id` is the unique key that prevents duplicates when re-syncing. It MUST be stable across re-syncs from the same source. Construction rules, in order of preference:

1. **Broker fill/execution id** (most granular) → `<broker>:exec:<id>` — e.g. `ibkr:exec:00018A4F`
2. **Broker order id** (if no fill-level id) → `<broker>:order:<id>` — e.g. `ibkr:order:103`
3. **Email confirmation number** (for Wealthsimple etc.) → `<broker>:conf:<num>` — e.g. `ws:conf:12345678`
4. **Manual entry without any broker id** → `manual:<sha256-12-chars>` where the hash inputs are exactly: `account|symbol|date|action|quantity|price` joined by `|` (lowercase, no spaces). Same trade entered twice produces the same id.

Before appending any execution, the sync prompt MUST read the current ledger, build the set of existing `id` values, and skip any candidate whose id is already present.

## Rules

- **Never edit** an existing execution entry. If a broker amends a fill, append a correcting `other` entry that references the original via `related_id` and explain in `notes`. The original stays in place — git history is your audit trail, the ledger is the rolling log.
- **Never delete** an execution. If a sync writes one in error, append a reversing `other` entry; do not rewrite.
- **Quantity is always positive.** Never use negative quantity to mean a sell. The action determines direction.
- **Prices are per-share.** For options, this means per share per contract (IBKR convention). A $0.30 option fill on 1 contract = `quantity: 1, price: 0.30, net_cash: 30 - fees`.
- **`net_cash` is the signed cash impact** including fees, in the execution currency. This is what reconciles to your statement.
- **`broker_order_ref` should match** the same field on the related decision file in `narrative/decisions/`, when one exists. The sync prompt should set `decision_ref` automatically when it finds a match.
- The `executions` array stays sorted by `date` ascending, then by `imported_at` ascending. Appending preserves order; never reorder existing entries.
- `last_synced_at` is the timestamp of the most recent successful sync run, regardless of whether new executions were appended. It's the default "since" cursor for the next run.

## Privacy

- No account numbers. The account *slug* is the identifier.
- No broker passwords, tokens, or session cookies — ever.
