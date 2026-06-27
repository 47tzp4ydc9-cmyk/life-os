# Five-Filter Framework

Before any new buy or watchlist add, run all five filters. The purpose is to avoid the **value trap** — a stock that is genuinely cheap on fundamentals but stays cheap for years because the market has no reason to reprice it.

A stock needs a reason for **other people** to buy it, not just you. Each filter tests one of those reasons.

## The filters

### 1. Catalyst — is there a dated, near-term event that forces a repricing?

A catalyst is a **specific, dated event** the market is forced to react to. Without one, cheap stocks stay cheap indefinitely.

| | Counts as |
|--|--|
| 🟢 Green | Earnings date within ~6 weeks, FDA decision date, contract announcement window, index inclusion review date, regulatory rule change with set start date, scheduled product launch, activist 13D filed |
| 🟡 Yellow | Catalyst exists but >6 weeks out, or the date is loosely defined ("next quarter") |
| 🔴 Red | No dated catalyst. "Fundamentals are good" / "it's undervalued" — those are opinions, not catalysts |

Catalysts are tracked in `narrative/catalysts/`. When this filter is green, link the catalyst slug in `related_catalysts`.

### 2. Institutional flow — is smart money already positioning?

You want to be slightly ahead of institutions, not way ahead. Major bank upgrades, fresh price-target raises, and unusual call buying in the last 2–4 weeks are signals that the buying base will sustain because institutions have client orders to fill.

| | Counts as |
|--|--|
| 🟢 Green | Upgrade or price-target raise from a major bank (Goldman, MS, JPM, sector specialist) in last 2–4 weeks; rising open interest in near-dated calls; coverage initiation by a tier-1 shop |
| 🟡 Yellow | Mixed analyst stance; flow neutral; old upgrades being reiterated without new info |
| 🔴 Red | Recent downgrades; insider selling (especially CFO/CEO); short interest rising without a clear short squeeze setup; ETF outflows from the relevant sector |

### 3. Chart / accumulation — does price action confirm someone is buying?

Price is the ultimate truth. Before buying anything, check: higher lows? Volume rising on up-days and declining on down-days? Holding above the 50-day or 200-day moving average?

| | Counts as |
|--|--|
| 🟢 Green | Higher lows over last 4+ weeks; rising volume on up-days; holding above 50DMA or reclaimed it; bullish MACD cross or constructive base |
| 🟡 Yellow | Range-bound but tightening; sitting on a key MA; MACD turning but not crossed |
| 🔴 Red | Lower highs; volume rising on down-days (distribution); broke a major support; MACD widening to the downside |

A stock flat for years with no volume is **being ignored**. Flat with rising volume and tightening range is **being quietly accumulated** — that's the setup you want.

### 4. Sector in favor — is the wind at your back?

Even great stocks get dragged down by sector rotation. A brilliant bank stock in a hated-banks tape will stay flat for a year. Filter out fights with the sector.

As of 2026-06-27, the operative grouping (update this list when the regime changes):

| Bucket | Sectors |
|--|--|
| 🟢 In favor | AI infrastructure (servers, networking, optical), defense, nuclear / power for data centers, memory & storage, custom silicon, GLP-1 obesity |
| 🟡 Mixed | Enterprise AI software, financials (rate-sensitive), industrials, energy ex-uranium |
| 🔴 Out of favor | Consumer discretionary, traditional retail, REITs, China ADRs, biotech excluding GLP-1, pure Bitcoin miners with no AI pivot |

Refresh this list quarterly or whenever a major regime change happens (Fed pivot, election, war).

### 5. Narrative fit — does the story fit what the market is already paying for?

Markets move on stories. If a stock's thesis requires the market to **start caring about something new**, you're early — and early is the same as wrong for 12–18 months.

**Quick test:** Can you explain why someone would buy this stock in **one sentence using words people are already talking about**? If yes, it fits the narrative. If you need three paragraphs, it doesn't.

| | Counts as |
|--|--|
| 🟢 Green | One-sentence pitch using current narrative keywords (AI infra, GLP-1, nuclear baseload, defense ramp, custom silicon, etc.) |
| 🟡 Yellow | Adjacent to a hot narrative but needs a bridge sentence |
| 🔴 Red | Story requires the market to develop a new interest; multi-paragraph explanation; cross-narrative pitch |

## How to score

- Each filter is one of 🟢 / 🟡 / 🔴.
- **Buy verdict:** typically 4+ green, no reds. The one yellow should be on chart or institutional flow — never on catalyst or narrative.
- **Wait verdict:** 3 green with reds on chart or flow that could turn (record the conditions that would flip them).
- **Skip verdict:** 2+ reds, or any red on catalyst + narrative simultaneously (that's the value-trap signature).

## Where to record the result

- **Research file** (`narrative/research/<slug>.md`): per-session full Five-Filter block with one-line notes per filter. Required for any session that ends with a buy/wait/skip verdict.
- **Watchlist** (`narrative/watchlist.md`): shorthand `N/5` in the Five-Filter column (count of greens). Update when the score changes.
- **Decision file** (`narrative/decisions/YYYY-MM-DD-<slug>.md`): reference the research file by name — do not re-score in the decision. The decision says "passed the 5-filter on <date>, see research/<slug>.md".

## When to re-run

- Before any new buy.
- Before adding to an existing position.
- When considering removing a name from the watchlist.
- After a major macro regime change (Fed pivot, election, war) — re-score the whole watchlist on filter 4.
- After earnings — the catalyst filter resets; check what's next.

## Worked example

NBIS on 2026-06-25 (entered the watchlist that day):

- **Catalyst** 🟢 — Q3 earnings in ~6 weeks, NVIDIA $2B anchor commitment dated
- **Institutional flow** 🟢 — multiple tier-1 initiations post-Nasdaq-100 inclusion
- **Chart** 🟢 — higher lows since early June, holding $234 support, MACD crossed up
- **Sector** 🟢 — AI infrastructure
- **Narrative** 🟢 — one-sentence pitch: "NVIDIA-anchored AI cloud, just added to Nasdaq-100"

Score: 5/5 → **buy** verdict. Entry target $234–250.

Contrast with HIVE same day:

- **Catalyst** 🔴 — earnings 54 days out, nothing nearer
- **Institutional flow** 🔴 — down 10.5% on no positive news
- **Chart** 🔴 — lower highs for months, broke support
- **Sector** 🔴 — pure Bitcoin miner, not AI
- **Narrative** 🔴 — no AI story, no data center story

Score: 0/5 → **skip**. Textbook unloved-stock value trap.
