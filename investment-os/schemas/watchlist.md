# Schema: watchlist

Ideas under consideration. Single file, table format. Live prices NOT stored here — fetched from `data/portfolio.db` or the broker on demand.

**Path:** `narrative/watchlist.md`

## Frontmatter

```yaml
---
type: watchlist
updated: 2026-06-27
---
```

## Body

A single Markdown table for open watchlist entries. Required columns:

| Symbol | Instrument | Person | Theme | Conviction | Target Entry | Target Exit | Catalyst | Five-Filter | Why Watching | Added |
|--------|------------|--------|-------|------------|--------------|-------------|----------|-------------|--------------|-------|

Column rules:
- `Instrument`: `us_stock | cdr | option | etf | leveraged_etf`
- `Person`: slug from `_shared/accounts.md`
- `Conviction`: 1–10
- `Catalyst`: slug of a `narrative/catalysts/*.md` file (without extension), or free text if no formal catalyst yet
- `Five-Filter`: shorthand `N/5` (count of green filters) from the framework in [`../strategies/five-filter.md`](../strategies/five-filter.md), or `—` if not yet evaluated

A second table tracks removed items:

| Symbol | Reason | Removed |
|--------|--------|---------|

## Rules

- Never delete a row — move to the Removed table with a reason and date.
- When promoting a watchlist row to a position, link the resulting decision file in the reason (`promoted → decisions/2026-06-27-glw.md`) and move to Removed.
