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

### `## ⚡ Quick read`

Always present. Single table:

```markdown
| Metric | Value | Δ vs prior session |
|---|---|---|
| NLV | $187,760 CAD | -$1,240 (-0.7%) |
| Leverage | 2.08× | +0.03 |
| Cash | $24,580 | unchanged |
| Catalysts firing today | 2 | NVO 9am, AMD AMC |
```

### `## 🔴 Action today (N)`

One sub-block per name. Each block must contain:

- `### SYMBOL — <one-line suggested action>`
- One-line stat row: price, after-hours move, option leg + delta (if applicable), days to expiry
- A classification table (always 5 columns):

```markdown
| Tag | News | Direction | Magnitude | Thesis impact |
|---|---|---|---|---|
| `[company]` | Sky-Z Mission 24 failure announced AH | ↓bear | 5-10% | **break** — reusability narrative compromised |
```

- 1-2 sentences: **why this matters** for *your* position (not generic commentary)
- Explicit suggested action + links to thesis / option / catalyst files

### `## 🟡 Monitor (N)`

One table for the whole section:

```markdown
| Symbol | Tag | Note | Action |
|---|---|---|---|
| SMCI | `[earnings]` | Q4 8/11. $34.10 (+0.8%). No new news. | hold |
| CIEN | `[sector]` | AI capex in MRVL transcript reinforces thesis. | hold |
| NBIS | `[analyst]` | New buy rating @ $52 PT. | watchlist |
```

### `## 🟢 Quiet (N)`

One line: backticked tickers + the standard sentence.

```markdown
`GLW` `CRWV` `IREN` `HOOD` — no material news in last 24h.
```

### `## 🎯 Catalysts firing today / tomorrow`

Table sourced from `narrative/catalysts/`:

```markdown
| When | Symbol | Event | File |
|---|---|---|---|
| Today 9am ET | NVO | CMS Part D negotiation list | [link](../catalysts/2026-07-01-novo-medicare-part-d.md) |
| Tomorrow AMC | AMD | Q2 earnings | [link](../catalysts/2026-08-04-amd-q2-earnings.md) |
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
