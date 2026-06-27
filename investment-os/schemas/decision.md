# Schema: decision

One file per significant action: buy, sell, trim, add, roll, rotate, close.

**Path:** `narrative/decisions/YYYY-MM-DD-<symbol-or-slug>.md`

## Frontmatter

```yaml
---
type: decision
created: 2026-06-27
updated: 2026-06-27
action: buy                    # buy | sell | trim | add | roll | rotate | close
person: jatan                  # slug from _shared/accounts.md
account: ibkr_margin           # slug from _shared/accounts.md
instrument: us_stock           # us_stock | cdr | option | etf | leveraged_etf
symbol: GLW                    # ticker or option underlying
quantity: 50                   # shares or contracts
strategy: swing                # core | swing | income | speculative
confidence: 7                  # 1-10
expected_holding: "3-6 months"
thesis_ref: theses/glw.md      # active thesis, if any
related_catalysts: []          # slugs from narrative/catalysts/
exit_plan: "Trim 1/3 at $80, full exit at $95 or thesis break"
broker_order_ref: "ibkr:103"   # <broker>:<order_id>; used to join to data/executions
tags: [photonics]
outcome: null                  # filled in later: thesis_correct | thesis_wrong | lucky | unlucky
lessons: null                  # filled in on close
retracted_at: null

# Only required when instrument: option
option:
  underlying: RKLB
  right: put                   # put | call
  side: short                  # short | long
  strike: 105
  expiry: 2026-09-18
  option_position_ref: options/rklb-105p-2026-07-10.md

# Required when action is buy or add; optional otherwise.
# Snapshot of the framework score at the moment of the decision.
# Full definitions in investment-os/strategies/five-filter.md.
five_filter:
  score: "5/5"                 # count of green filters
  verdict: buy                 # buy | wait | skip
  catalyst: green              # green | yellow | red
  institutional_flow: green
  chart: green
  sector: green
  narrative: green
  notes: "Aug 11 earnings; GF $48 PT; near 52W lows; AI servers; clean narrative"
  research_ref: null           # research/<slug>.md if the scores were sourced from a research session
---
```

## Body sections

```markdown
## Why

(one paragraph: the trigger, the reasoning, what made *now* the right time)

## Chart context

(at the moment of decision: key levels, MACD/RSI values, optional screenshot path under narrative/decisions/charts/)

## What I'm wrong about if this fails

(the disconfirming evidence to watch for)

## Outcome (filled later)

(written on close: was the thesis right? Was the trade lucky or unlucky?)
```

## Rules

- Never edit `action`, `person`, `account`, `symbol`, `quantity`, `option` after the first commit — they're historical.
- Update `outcome` and `lessons` on close, never before.
- If you retract a decision (wrong write, duplicate), set `retracted_at` rather than delete.
- `broker_order_ref` should be filled when known so reconciliation scripts can join this decision to its execution row in `data/portfolio.db`.
- For option actions (buy/sell/roll), the running position lives in `narrative/options/` — this file just records the discrete action.
- `five_filter` is **required** for `action: buy` and `action: add` on equity / ETF / CDR instruments. It is **optional** for `sell`, `trim`, `close`, `roll`, `rotate` (those are exits or position-management actions, not new-idea entries). It is also optional for short-term overnight contagion trades — if you skip it, say so in the body and explain why.
- The `five_filter` block is **frozen at decision time** and never edited later, even if the research file's scores change. The decision is a snapshot of what was true at the trigger moment.
