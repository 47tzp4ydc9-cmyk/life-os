# Schema: catalyst

A dated event expected to move one or more symbols. Decisions, theses, and watchlist entries reference catalysts by slug instead of duplicating the description, so when the date passes the outcome is captured once.

**Path:** `narrative/catalysts/YYYY-MM-DD-<slug>.md`
Example: `narrative/catalysts/2026-08-04-amd-q2-earnings.md`

## Frontmatter

```yaml
---
type: catalyst
created: 2026-06-27
updated: 2026-06-27
event_date: 2026-08-04       # the date of the event; null if only a window
event_window: null           # "2026-07-01..2026-07-15" if a range; null otherwise
category: earnings           # earnings | macro | regulatory | index_inclusion | product | corporate_action | other
affects: [AMD]               # symbols or themes most affected
confidence: high             # low | medium | high — how confident the date itself is
direction: bullish           # bullish | bearish | binary | unknown
status: pending              # pending | passed | cancelled | superseded
outcome: null                # filled after event_date: beat | miss | inline | cancelled | n/a + short text
tags: [ai-infra]
---
```

## Body sections

```markdown
## What

(one paragraph: what the event is, why it matters)

## What I expect

(direction + magnitude expectation; optional)

## What I'll do

(pre-event positioning, exit plan)

## Outcome (filled after event_date)

(actual result, P&L impact across affected positions, lesson)
```

## Rules

- After `event_date` passes, set `status: passed` and fill `outcome` within 7 days.
- A cancelled or postponed catalyst keeps the file with `status: cancelled` and a note; create a new file for the new date and link it under `superseded_by:` in the old file's body.
- Other narrative files reference catalysts via `related_catalysts: [2026-08-04-amd-q2-earnings]` (slug without extension).
