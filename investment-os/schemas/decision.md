# Schema: decision

One file per significant action: buy, sell, trim, add, roll, rotate, close.

**Path:** `narrative/decisions/YYYY-MM-DD-<symbol-or-slug>.md`

## Frontmatter

```yaml
---
type: decision
created: 2026-06-27
updated: 2026-06-27
action: buy            # buy | sell | trim | add | roll | rotate | close
symbol: GLW            # ticker or option underlying
account: ibkr          # ibkr | wealthsimple
quantity: 50           # shares or contracts
strategy: swing        # core | swing | income | speculative
confidence: 7          # 1-10
expected_holding: "3-6 months"  # free text, but be specific
thesis_ref: theses/glw.md       # link to the active thesis, if any
exit_plan: "Trim 1/3 at $80, full exit at $95 or thesis break"
catalysts: [Q3 earnings, photonics design wins]
tags: [photonics]
outcome: null          # filled in later: thesis_correct | thesis_wrong | lucky | unlucky
lessons: null          # filled in on close
retracted_at: null
---
```

## Body sections

```markdown
## Why

(one paragraph: the trigger, the reasoning, what made *now* the right time)

## What I'm wrong about if this fails

(the disconfirming evidence to watch for)

## Outcome (filled later)

(written on close: was the thesis right? Was the trade lucky or unlucky?)
```

## Rules

- Never edit `action`, `symbol`, `quantity` after the first commit — they're historical.
- Update `outcome` and `lessons` on close, never before.
- If you retract a decision (wrong write, duplicate), set `retracted_at` rather than delete.
