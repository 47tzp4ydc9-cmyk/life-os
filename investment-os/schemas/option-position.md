# Schema: option-position

A short or long option position tracked from open through every roll to final close/expiry/assignment. One file per **logical position** — rolls extend the same file rather than creating new ones.

**Path:** `narrative/options/<symbol>-<strike><p|c>-<original-expiry>.md`
Example: `narrative/options/rklb-105p-2026-07-10.md` (kept after rolling to Sep 18 — the filename is the original entry).

## Frontmatter

```yaml
---
type: option-position
created: 2026-06-25
updated: 2026-06-25
person: jatan
account: ws_margin           # slug from _shared/accounts.md
underlying: RKLB
side: short                  # short | long
right: put                   # put | call
strategy: csp                # csp | covered_call | naked_call | long_call | long_put | spread
status: open                 # open | closed | expired | assigned | rolled_closed
contracts: 1
current_strike: 105
current_expiry: 2026-09-18
original_strike: 105
original_expiry: 2026-07-10
net_premium: 575             # cumulative net cash, USD; positive = net credit
related_thesis: theses/rklb.md
related_catalysts: []
tags: [income, swing]
---
```

## Body sections

```markdown
## Why opened

(one paragraph: the trigger, the strike/expiry logic, IV at open)

## Rolls

| Date | Action | From | To | Net cash | IV |
|------|--------|------|----|---------|----|
| 2026-06-25 | roll out | Jul10 105P | Sep18 105P | +$575 credit | 91.5% |

## Assignment plan

(what you do if it goes deep ITM — defend, accept assignment, take loss)

## Outcome (filled on close)

(realized P&L, lesson)
```

## Rules

- Filename is permanent — derived from the original open. Rolls update `current_strike` / `current_expiry` and append a row to the `## Rolls` table.
- `net_premium` is cumulative across all legs: opening credit + every roll's net credit − every debit − closing cost.
- On assignment, set `status: assigned` and create a separate `decision` file for the resulting stock position with `broker_order_ref` pointing back here.
- Never edit historical rows in the `## Rolls` table.
