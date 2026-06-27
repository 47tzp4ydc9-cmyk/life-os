# Schema: prediction

A dated, falsifiable claim about a stock, market, or strategy — yours or the AI's. Verified later. The point is accountability over time, not being right every time. Wrong predictions stay in the repo; they are the most useful kind.

**Path:** `narrative/predictions/YYYY-MM-DD-<slug>.md`

## Frontmatter

```yaml
---
type: prediction
created: 2026-06-25
updated: 2026-06-25
made_by: claude              # jatan | claude | chatgpt
about: IREN                  # symbol, theme, or "market"
claim: "IREN won't be a clean buy until MACD crosses up and price reclaims $50"
verify_on: 2026-07-15        # when this becomes checkable; required
verified: false
outcome: null                # correct | wrong | partially_correct | unfalsifiable
reasoning_then: "MACD deeply negative, lower highs since Jun 3, underperformed SOXL on a +10% day"
related_decisions: []        # decision files this prediction influenced (if any)
---
```

## Body sections

```markdown
## Claim

(restate in plain English)

## What would prove it wrong

(specific observable — the disconfirming evidence)

## Verification (filled on verify_on)

(actual outcome, what was missed, lesson)
```

## Rules

- Every prediction MUST have `verify_on` — vague "eventually" claims don't count.
- On `verify_on`, set `verified: true`, fill `outcome` and the verification section.
- Never delete or rewrite a prediction. Add a follow-up prediction file if your view changes.
