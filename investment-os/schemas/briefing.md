# Schema: briefing

Generated morning, midday, or evening summary of portfolio state + action items. Mostly machine-written.

**Path:** `narrative/briefings/YYYY-MM-DD-<morning|midday|evening>.md`

## Frontmatter

```yaml
---
type: briefing
created: 2026-06-27
updated: 2026-06-27
session: morning             # morning | midday | evening
generated_by: claude         # claude | chatgpt | human
sources: [ibkr, wealthsimple_gmail, market_data]
nlv_cad: 187760              # net liquidation value at briefing time
leverage: 2.08               # null if not on margin
---
```

## Body sections

```markdown
## Alerts

(margin calls, partial fills, dividends, anything that needs action before reading further)

## Account summary

(NLV, buying power, leverage, change vs prior session)

## Positions

(winners / losers, key movers, pre-market for morning briefings)

## Options book

(expiring within 14 days, deep ITM, anything that needs a decision)

## Catalysts this week

(reference by slug from narrative/catalysts/)

## Action items for today

(priority-tagged, with related symbol — same format as action-items.md)
```

## Rules

- Briefings are append-only after generation — they're a record of "what I was looking at when." Don't rewrite history.
- Numbers reflect the moment of generation; `data/portfolio.db` is the source of truth thereafter.
- If a fact was wrong (typo, bad parse), add a `## Correction` section at the bottom rather than editing the body.
