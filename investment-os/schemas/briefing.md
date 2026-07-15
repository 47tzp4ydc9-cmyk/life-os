# Schema: briefing

Generated morning, midday, or evening summary of portfolio state + actionable news. Mostly machine-written; runs autonomously as a scheduled routine and on manual trigger.

**Path:** `narrative/briefings/YYYY-MM-DD-<morning|midday|evening>.md`

## Frontmatter

```yaml
---
type: briefing
created: 2026-06-28
session: morning             # morning | midday | evening
trigger: routine             # routine | manual
generated_by: claude         # claude | chatgpt | human
generated_at: 2026-06-28T06:00:00-04:00
sources: [ibkr, gmail, web_search, life-os-mcp, sec_edgar]
nlv_cad: 187760              # net liquidation value at generation time
leverage: 2.08               # null if not on margin
status: action               # action | monitor | quiet  (overall severity)
red_count: 2                 # number of 🔴 ACTION names
yellow_count: 3              # number of 🟡 MONITOR names
green_count: 4               # number of 🟢 QUIET names
---
```

## Body sections (in this order; omit empty sections except Quick Read)

### `> 📌 TL;DR` (required unless quiet-day early exit)

First block after the frontmatter — before Quick Read. A single blockquote, one imperative bullet per 🔴 item (or per 🟡 item if `red_count == 0`), max 3 lines. No prose, no context — just the action.

```markdown
> **Do today:**
> 1. Verify WS margin-call status (ws_margin, HQ850HX03CAD).
> 2. Confirm 3 unrecognized WS buys (~$10,977) — possible compromise.
> 3. Decide SMCI hold/trim/exit (day 11).
```

If `red_count == 0` and `yellow_count > 0`, use `> **Watch today:**` and list top 3 🟡 items.

### `> 🔗 Links` (required)

Single blockquote line, immediately below TL;DR. Fixed structure:

```markdown
> **Links:** [repo](https://github.com/47tzp4ydc9-cmyk/life-os/blob/main/investment-os/narrative/briefings/YYYY-MM-DD-<session>.md) · [prior](./PRIOR-FILENAME.md) · [action items](../action-items.md) · [watchlist](../watchlist.md)
```

- `repo` = GitHub blob URL to this exact file (fill in today's date + session).
- `prior` = filename of the immediately-preceding briefing on disk (walk back through the directory; may be a different session).

### `## ⚡ Quick read`

Always present. Single table followed by a **required** bulleted `**What changed since prior:**` list (2-5 bullets, one discrete observation each — do not write a wall-of-text paragraph):

```markdown
| Metric | Value | Δ vs prior session |
|---|---|---|
| NLV | $187,760 CAD | −$1,240 (−0.7%) |
| Leverage | 2.08× | +0.03 |
| Cash | $24,580 | unchanged |
| Catalysts firing today | 2 | NVO 9am, AMD AMC |

**What changed since prior:**
- Chip/AI-infra bounced (NBIS +10.9%, ANET +8.8%, AVGO +4.8%) after Jul 7 Samsung-triggered reset — mechanical, not fundamental.
- WS margin account escalated from "at risk" (Jul 7) to actual margin call (Jul 8 07:09 ET).
- 3 unrecognized WS buys (SOXL/NOK/IONQ, ~$10,977) landed same morning as the margin call.
- INTC 100sh mystery resolved: legitimate Jul 7 buy @ $109.12 (order 1223914127).
- SMCI day 11 — Taiwan case still zero new developments.
```

Use `−` (U+2212 minus) consistently for negative numbers — never `-` (hyphen-minus). Use `+` for positive.

### `## 🔴 Action today (N)`

One sub-block per name. Each block must contain:

- `### SYMBOL — <one-line suggested action>`
- **Backlink line** (required, muted italics, immediately under the title). Include only the files that exist:
  ```markdown
  *[thesis](../theses/SYMBOL.md) · [decision](../decisions/YYYY-MM-DD-SYMBOL.md) · [catalyst](../catalysts/YYYY-MM-DD-SYMBOL-*.md)*
  ```
- One-line stat row: price, after-hours move, option leg + delta (if applicable), days to expiry
- A classification table (always 5 columns):

```markdown
| Tag | News | Direction | Magnitude | Thesis impact |
|---|---|---|---|---|
| `[company]` | Sky-Z Mission 24 failure announced AH | ↓bear | 5-10% | **break** — reusability narrative compromised |
```

- 1-2 sentences: **why this matters** for *your* position (not generic commentary)
- Explicit suggested action + links to thesis / option / catalyst files

#### Stale-item compression rule

If the same 🔴 item has been carried in ≥ 3 consecutive briefings without meaningful change, replace the "why this matters" paragraph with a single one-liner:

```markdown
> Same call as [prior briefing](./YYYY-MM-DD-<session>.md) — day N carrying. New today: <one line, or "nothing">.
```

Keep the title, backlink line, stat row, classification table, and suggested action. Drop the repeated context prose — the day-count is the signal, the repeated body is noise.

### `## 🟡 Monitor (N)`

One table for the whole section:

```markdown
| Symbol | Tag | Note | Action |
|---|---|---|---|
| SMCI | `[earnings]` | Q4 8/11. $34.10 (+0.8%). No new news. | hold |
| CIEN | `[sector]` | AI capex in MRVL transcript reinforces thesis. | hold |
| NBIS | `[analyst]` | New buy rating @ $52 PT. | watchlist |
```

**Grouping rule:** if `yellow_count > 10`, split the table by theme with `#### <theme>` sub-headers before each sub-table. Themes should reflect the day's actual clustering (e.g. `AI-infra chip cluster`, `Macro-driven`, `Single-name idiosyncratic`) — do not force categories that don't apply.

### `## 🟢 Quiet (N)`

One line: backticked tickers + the standard sentence.

```markdown
`GLW` `CRWV` `IREN` `HOOD` — no material news in last 24h.
```

### `## 🛡️ Security & margin` *(conditional; hard-capped)*

All security-alert, margin-call, and account-integrity content lives here. **Two lines maximum, combined, across all such items.** One bullet per open item:

```markdown
- **ws-margin-status** — monitoring, no fresh alert since Jul 10 · confirm on next WS login
- **ws-overnight-fills** — user-authorized per Jul 14 Correction · no action
```

Rules:
- No tables. No "why this matters" prose. No repeated background.
- No dramatic emojis (⚠️ 🚨) in the bullets themselves — the section header carries the flag.
- An item may only appear in `## 🔴 Action today` instead of here if BOTH: (a) a new broker alert / lock / auth event triggered this cycle, AND (b) the item has not been marked authorized / resolved / not-an-incident by a prior `## Correction` or a completed action-item. Otherwise it lives here.
- Pattern-repetition ("Nth consecutive night") is not a fresh trigger. See `routines/morning-briefing.md` Step 5.5.

### `## 🎯 Catalysts firing today / tomorrow`

Table sourced from `narrative/catalysts/`:

```markdown
| When | Symbol | Event | File |
|---|---|---|---|
| Today 9am ET | NVO | CMS Part D negotiation list | [link](../catalysts/2026-07-01-novo-medicare-part-d.md) |
| Tomorrow AMC | AMD | Q2 earnings | [link](../catalysts/2026-08-04-amd-q2-earnings.md) |
```

**Split rule:** anything landing within the next 5 trading days stays in the visible table. Everything further out goes inside a collapsed block:

```markdown
<details><summary>Later (N events)</summary>

| When | Symbol | Event | File |
|---|---|---|---|
| Wed Jul 29 | WDC | Earnings call | — |
| Mon Aug 11 | SMCI | Q4 earnings — binary | [link](../catalysts/2026-08-11-smci-q4-earnings.md) |

</details>
```

### `## 📈 Macro / sector` *(conditional)*

Include **only if** any of: SPY pre-market move > 1.5%, Fed/CPI/jobs print today, or your concentration sector moved > 1%. Otherwise omit.

### `## ✅ Action items added`

Mirror the new entries appended to `action-items.md` this run, with checkbox + tags. The source of truth is `action-items.md`; this section is just a record of what this briefing added.

```markdown
- [ ] **rklb-roll-decision** [priority:high] [due:2026-06-28] — decide close vs roll 105p before open
```

## Severity rules (how a name lands in 🔴 vs 🟡 vs 🟢)

🔴 **ACTION TODAY** — any one of:
- Thesis impact = `break`
- Thesis impact = `binary` AND the deciding catalyst fires today
- Open option position with < 14d to expiry AND material news (any direction)
- Stop / target hit pre-market

🟡 **MONITOR** — any one of:
- Thesis impact = `modify`
- Analyst rating or PT change
- Sector-wide move > 2% with you concentrated in that sector
- A name from the watchlist gapped through its `target_entry`

🟢 **QUIET** — none of the above. Group these in one line; do not pad with filler.

## Early-exit rule

If 🔴 = 0 AND 🟡 ≤ 1 AND no catalyst firing today AND SPY pre-market move < 1%, write only the frontmatter + Quick Read + a one-line note `> Status: 🟢 quiet day — no action required.` and stop. No padding sections. A short briefing is a feature, not a bug.

## Tag vocabulary

**News type** (pick one per row):
- `[earnings]` — earnings release, guidance update, transcript readout
- `[analyst]` — rating change, PT change, initiated coverage
- `[regulatory]` — SEC, FDA, FTC, EU/foreign regulator action
- `[macro]` — Fed, CPI, jobs print, geopolitical
- `[sector]` — peer move, commodity move, secular shift
- `[company]` — operational, product launch, leadership change
- `[insider]` — insider buy/sell, 13D/13G filing
- `[m&a]` — acquisition, divestiture, merger talk

**Direction:** `↑bull` · `↓bear` · `→neutral` · `mixed`

**Magnitude** (expected price impact today): `<2%` · `2-5%` · `5-10%` · `>10%`

**Thesis impact** (vs the file in `narrative/theses/<symbol>.md`):
- `ratify` — confirms the thesis
- `modify` — alters one variable but core assumption stands
- `break` — invalidates a core assumption
- `binary` — outcome will ratify or break depending on an imminent event
- `n/a` — no thesis on file for this name

## Rules

- Briefings are append-only after generation — they're a record of "what I was looking at when". Don't rewrite history.
- Numbers reflect the moment of generation; `data/portfolio.db` is the source of truth thereafter.
- Do not invent news. If web search returns nothing material on a Tier 1 name, mark it 🟢.
- If a fact was wrong (typo, bad parse), add a `## Correction` section at the bottom rather than editing the body.
- One briefing file per session per day — overwrite is not allowed except via the `## Correction` pattern.
- **Corrections are binding forward.** Once a prior briefing's `## Correction` marks an item resolved / authorized / decided / false-positive, subsequent briefings MUST NOT restate that item at 🔴 severity. Downgrade to 🟡 / 🛡️ or omit. See `routines/morning-briefing.md` Step 5.6.
- **Security & margin items are hard-capped at 2 lines** in the dedicated 🛡️ section. They may not appear in 🔴 unless a fresh, unacknowledged broker alert triggered this cycle.
