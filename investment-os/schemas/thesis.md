# Schema: thesis

One file per active position or active theme. Updated as the thesis evolves; old versions live in git history.

**Path:** `narrative/theses/<symbol-or-slug>.md`

## Frontmatter

```yaml
---
type: thesis
created: 2026-06-27
updated: 2026-06-27
person: jatan            # slug from _shared/accounts.md; "shared" if held across people
symbol: GLW              # ticker, OR null if this is a theme thesis
theme: photonics         # null if symbol-specific only
status: active           # active | paused | closed
conviction: 8            # 1-10
horizon: "1-3 years"
key_metrics: [datacom revenue growth, optical connector ASPs]
disconfirming: [datacom revenue stalls 2 consecutive quarters, AI capex pause]
related_research: [research/silicon-photonics.md]
related_catalysts: []    # slugs from narrative/catalysts/
---
```

## Body sections

```markdown
## Summary

(2-3 sentences a future-you can read in 30 seconds)

## Why this works

(the bull case, in your own words)

## What kills it

(the bear case — be honest, this is the most useful section in a year)

## What I'm tracking

(specific data points, earnings line items, news triggers)

## Decisions log

| Date | Action | Qty | Price | Account | Outcome | File |
|------|--------|-----|-------|---------|---------|------|
| 2026-06-25 | buy | 300 | $31.84 | ws_margin | (open) | [smci](../decisions/2026-06-25-smci.md) |

## Revisions

- 2026-06-27: initial
```

## Rules

- One thesis per symbol/theme. Don't fragment.
- The `## Decisions log` table is the index into per-action decision files for this symbol. **Append** one row whenever a new decision file is committed for this symbol — the running story lives here; the immutable event lives in `narrative/decisions/`. Never delete rows from the log; mark `outcome` on close.
- Add a dated line under `## Revisions` whenever the body materially changes.
- When closing a position, set `status: closed` but do not delete — link to it from the closing decision.
