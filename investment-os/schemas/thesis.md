# Schema: thesis

One file per active position or active theme. Updated as the thesis evolves; old versions live in git history.

**Path:** `narrative/theses/<symbol-or-slug>.md`

## Frontmatter

```yaml
---
type: thesis
created: 2026-06-27
updated: 2026-06-27
symbol: GLW              # ticker, OR null if this is a theme thesis
theme: photonics         # null if symbol-specific only
status: active           # active | paused | closed
conviction: 8            # 1-10
horizon: "1-3 years"
key_metrics: [datacom revenue growth, optical connector ASPs]
disconfirming: [datacom revenue stalls 2 consecutive quarters, AI capex pause]
related_research: [research/silicon-photonics.md]
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

## Revisions

- 2026-06-27: initial
```

## Rules

- One thesis per symbol/theme. Don't fragment.
- Add a dated line under `## Revisions` whenever the body materially changes.
- When closing a position, set `status: closed` but do not delete — link to it from the closing decision.
