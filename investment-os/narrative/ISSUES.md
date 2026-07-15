# Issues Log

Running log of known data, tooling, and analysis issues. Not a bug tracker — just a place to capture things to investigate or optimize later.

Format: `## ISSUE-NNN — <short title>`

---

## ISSUE-001 — ADBE position count: split fills miscounted as fewer shares

**Discovered:** 2026-06-29  
**Module:** investment-os  
**File:** `investment-os/narrative/ledger/ibkr_margin.md`  
**Status:** open — needs optimization  

**Description:**  
When estimating the ADBE position size from ledger fills, Claude counted 34 shares instead of the
correct 50. The Jun 12 fills were two partial fills (4 shares + 16 shares = 20 shares) that were
collapsed into just the first partial when summing. The ledger data itself is correct; the issue
is in how multi-part fills for the same symbol on the same date get aggregated during analysis.

**Actual fills:**
- 2026-06-11: Buy 30 @ $221.77
- 2026-06-12: Buy 4 @ $197.38 (partial fill 1)
- 2026-06-12: Buy 16 @ $197.38 (partial fill 2)
- Total: 50 shares @ $212.05 blended avg ✅

**Impact:** Incorrect position size and P&L estimate surfaced in analysis ($275 loss vs $440 estimated).

**To fix:** When summing positions from ledger, aggregate all fills for a symbol before reporting
quantity and avg cost — don't stop at the first fill entry per date.

---

## ISSUE-002 — Morning briefing missing watchlist / market stocks (WDC, MU, etc.)

**Discovered:** 2026-06-29  
**Module:** investment-os  
**File:** `investment-os/prompts/` (no morning briefing prompt exists)  
**Status:** open — prompt needs to be created  

**Description:**  
The morning briefing only surfaces existing open positions and decisions from the narrative files.
It does not pull current prices or news for watchlist stocks (WDC, MU, GLW, NBIS, etc.) or
broader market movers relevant to the portfolio. This means high-momentum names like WDC (+10%
intraday on Jun 29) are invisible unless the user asks explicitly.

**Root cause:** No `morning-briefing.md` prompt exists in `investment-os/prompts/`. The briefing
is currently ad-hoc, driven entirely by whatever the user asks. There is no structured template
that instructs Claude to: (a) read the watchlist, (b) search current prices for watchlist + open
positions, (c) surface trade ideas, (d) flag catalyst dates coming up.

**To fix:** Create `investment-os/prompts/morning-briefing.md` with explicit sections for:
  1. Open positions — current price vs avg cost (read ledger, aggregate all fills per symbol)
  2. Watchlist — current price vs entry target, any overnight news
  3. Catalyst calendar — upcoming events within 7 days
  4. Trade ideas — momentum setups, dip opportunities, options income plays
  5. ISSUES.md check — flag any open issues that affected today's analysis

---

## ISSUE-003 — Morning briefing has no trade ideas section

**Discovered:** 2026-06-29  
**Module:** investment-os  
**Status:** open — blocked on ISSUE-002 (no briefing prompt)  

**Description:**  
Related to ISSUE-002. Even when the morning briefing is improved, it currently has no section
for proactive trade ideas. User wants: momentum setups, dip buys, options income opportunities,
and sector rotation plays surfaced each morning alongside the existing position review.

**To fix:** Include a "Trade Ideas" section in the morning briefing prompt (see ISSUE-002).
Structure: 1-3 high-conviction ideas with entry, target, stop, and catalyst. Distinguish between
ideas that fit existing positions (adds/trims) vs new ideas.

---

## ISSUE-004 — Trade Ideas section lacks buy-the-rumor/sell-the-news check on catalysts

**Discovered:** 2026-06-30  
**Module:** investment-os  
**File:** `investment-os/prompts/morning-briefing.md`  
**Status:** open — prompt needs update  

**Description:**  
A Trade Ideas entry for NVO (pre-Medicare-Part-D-coverage add) cited "seniors largely unaware" of
GLP-1 Medicare coverage as the informational edge driving the catalyst. On review, the news had
already been covered in mainstream financial press (CNBC and others) for several days prior, and
NVO's price action showed weakness/selling into the catalyst rather than a rumor-driven run-up —
so the claimed informational asymmetry didn't hold up under a quick search check.

**Root cause:** The Trade Ideas section generates catalyst-driven setups without checking (a) how
long the catalyst has been public knowledge, or (b) whether price action already reflects
anticipation of the catalyst (a run-up = likely priced in already).

**To fix:** Update the Trade Ideas generation logic in `investment-os/prompts/morning-briefing.md`
so any idea citing a specific catalyst includes a one-line staleness/price-action check:
  1. Search how long the catalyst has been public (hours vs. days vs. weeks).
  2. Note whether price has already run up toward the catalyst (rumor priced in) or stayed
     flat/weak (edge may still exist, or market is skeptical for other reasons).
  3. Explicitly state in the catalyst description whether the thesis relies on informational
     asymmetry (fresh, not-yet-priced news) vs. a fundamental re-rating bet that happens to
     coincide with a date.
  4. If the catalyst is stale (covered >48h in mainstream financial press) and informational
     asymmetry is the core thesis, downgrade conviction language or flag explicitly — e.g.
     "catalyst is public knowledge as of [date]; thesis depends on follow-through data, not
     informational edge."

**Acceptance criteria:**
- Trade ideas citing a catalyst include a one-line staleness/price-action check.
- Language avoids implying informational asymmetry ("X is unaware of Y") unless verified fresh.

---

## ISSUE-005 — Unknown ledger: ws_jatan_corp.md exists but not in _shared/accounts.md

**Discovered:** 2026-06-30  
**Module:** investment-os  
**File:** `investment-os/narrative/ledger/ws_jatan_corp.md`  
**Status:** open — needs clarification  

**Description:**  
A ledger file `ws_jatan_corp.md` exists in the ledger directory but is not listed in
`_shared/accounts.md` as an authorized account slug. When reconciling MRVL positions across all
accounts, this ledger was found but excluded from the tally because the account slug is not
recognized as valid per AGENTS.md rules ("Use only person and account slugs from
_shared/accounts.md — never invent variants").

**Questions:**
1. Is `ws_jatan_corp` a legitimate account that should be added to `_shared/accounts.md`?
2. If yes, is it a Wealthsimple account belonging to Jatan, and what is its full canonical slug?
3. If no, should the ledger file be archived or deleted?

**Impact:** Low (ledger exists but is not included in multi-account position tallies until slug
is recognized). May grow in importance if this is an active account being funded.

**To fix:** Either (a) add `ws_jatan_corp` to `_shared/accounts.md` with full metadata, or
(b) move/delete the ledger file and document the decision in this issue.

---

## ISSUE-006 — Ledger position totals are incorrect; parser does not handle open/close state

**Discovered:** 2026-07-10  
**Module:** investment-os  
**File:** `investment-os/narrative/ledger/*.md` (all accounts)  
**Status:** open — blocking accurate position reporting  

**Description:**  
When Claude tallies positions (e.g., "how much META do I have?"), the script calculates gross
shares or options by summing buys and subtracting sells. However, it does NOT track open vs. closed
states for options. For example:

- `short_open` 1 PUT on 2026-05-06 @ $55.55 (strike $590)
- `short_close` 1 PUT on 2026-05-22 @ $54.05 (strike $590)

The script treats these as **two separate contracts** (net -1 short) instead of recognizing them as
a single contract opened and closed. When multiple opens/closes occur on the same position
(same symbol, strike, expiry, side), the tally becomes wrong.

**Example:** META was reported as having 4 open short puts in ibkr_margin, but all 4 were actually
closed (2 pairs of open/close). Correct position: 0 open puts.

**Root cause:** The parser only looks at action (`short_open`, `short_close`, `buy`, `sell`) and
quantity, not the actual state machine (contract is open until it's closed).

**Impact:** High — users see phantom positions when checking holdings. Makes risk assessment
incorrect.

**To fix:** Update the position tally logic to:
1. Group options by (symbol, strike, expiry, side) key.
2. For each key, iterate fills chronologically and track state:
   - Start: quantity = 0, state = "closed"
   - `short_open` → quantity -= N, state = "open"
   - `short_close` → quantity += N, state = "closed"
   - `buy` (for longs) → quantity += N, state = "open"
   - `sell` (for longs) → quantity -= N, state = "closed"
3. Only report positions where quantity ≠ 0 AND state = "open".

Alternatively: add a `closed_at` field to the ledger schema for options, and only count entries
where `closed_at` is null.

---

## ISSUE-007 — Fetching ledger positions requires manual Python script; should be automated

**Discovered:** 2026-07-10  
**Module:** investment-os  
**File:** `investment-os/data/` (no cache) or new automation needed  
**Status:** open — needs tooling  

**Description:**  
To answer "what's my total META position?", Claude currently must:
1. Clone the repo (network I/O).
2. Run a multi-account grep/regex script (parsing, state machine).
3. Aggregate results manually.
4. Report back.

This is fragile because: (a) it's ad-hoc script, not reusable, (b) it conflicts with IBKR live
data (which shows different numbers if ledger is stale), (c) running this every time is slow and
uses unnecessary token budget.

**Root cause:** No automated position cache exists. The AGENTS.md guidance says "prefer reading
SQLite database for live quantitative questions" but no DB schema or build pipeline is documented.

**To fix:** One or more of:
1. Create a `investment-os/data/positions.db` (SQLite) that is built from ledger files on each
   commit (or refreshed separately), indexed by (account, symbol, is_option).
2. Create an `investment-os/data/positions.json` snapshot (regeneratable) that Claude can read
   in <100ms (no parsing needed).
3. Alternatively, add a `position_summary()` helper or prompt in `investment-os/prompts/` that
   wraps the script and can be called via MCP.
4. For live (intraday) questions, require IBKR fetch, not ledger — ledger is historical.

**Acceptance criteria:**
- Multi-account position queries return in <1s without running a regex script.
- Results agree with ledger when ledger is current.
- Results agree with IBKR when ledger is stale (IBKR is source of truth for live positions).

---

## ISSUE-008 — Per-name briefing write-ups don't decompose sector/macro beta from idiosyncratic news

**Discovered:** 2026-07-15  
**Module:** investment-os  
**File:** `investment-os/schemas/briefing.md`, evening/morning briefing routines  
**Status:** open — schema/routine needs update  

**Description:**  
The 2026-07-15 evening briefing classified GLW as 🔴 with framing that called its -7.8% drop
"idiosyncratic, not sector beta" (see [`narrative/briefings/2026-07-15-evening.md`](briefings/2026-07-15-evening.md)
and its `## Correction` section). In fact the same session's own Macro/sector note recorded a
broad semiconductor/high-multiple-name selloff that day (SMH -2.5%, MU -7%, SNDK -12.8%,
INTC -5.3%). GLW's move was mostly dispersion within that sector-wide rotation — amplified by its
stretched valuation (68x forward earnings) — not a distinct new headline. The pre-existing setup
(Jul 11 Sell downgrade, prior-session put buying, proximity to Jul 28 earnings) was real and
justified the 🔴 flag, but the write-up conflated "this name has a real setup worth flagging"
with "this name moved for its own reason today," which the user caught and had to push back on.

**Root cause:** The briefing schema's per-name classification (`## 🔴 Action today`) has no step
that requires checking a name's move against the same session's own `## 📈 Macro / sector` data
before describing the move as company-specific. The two sections are generated somewhat
independently, so a name can get an "idiosyncratic" framing even when the day's macro/sector data
(gathered for the same briefing) already explains most of the magnitude.

**To fix:** Before writing "why this matters" language for a 🔴/🟡 name, cross-check its move
against the day's sector ETF / peer-group move (already gathered for the Macro/sector section):
1. If the name's move is within ~1-2x of the sector's move that day, default to attributing it to
   sector beta and say so explicitly, even if the name also carries its own real catalyst/setup.
2. Only use "idiosyncratic" / "not sector beta" language when the name's move meaningfully exceeds
   sector peers AND there's a same-day (not multi-day-old) headline that plausibly explains the
   gap.
3. When a name has both a real standing setup (downgrade, options positioning, earnings proximity)
   and a sector-driven day, separate the two explicitly in the write-up: "today's move is mostly
   sector rotation; the reason this name is flagged 🔴 regardless is X" — rather than presenting
   the setup as if it explains today's specific price action.

**Acceptance criteria:**
- Any 🔴/🟡 name whose write-up characterizes its move as company-specific/idiosyncratic includes
  an explicit comparison to that day's sector/peer move.
- Severity classification (🔴 vs 🟡) can still stand on a real standing setup even when the day's
  price action is mostly sector beta — but the write-up must say so plainly instead of implying a
  fresh idiosyncratic catalyst.

---

## ISSUE-009 — Watchlist rots (converted-to-position rows not retired, stale targets not refreshed)

**Discovered:** 2026-07-10  
**Module:** investment-os  
**File:** `investment-os/narrative/watchlist.md`  
**Status:** resolved — 2026-07-10 (routine change + baseline reconciliation both landed; spun off as ISSUE-010 for missing decision files)  

**Description:**  
`watchlist.md` last showed `updated: 2026-06-27`. Four of its seven active rows (GLW, NBIS, CRWV,
IREN) had since been opened as live positions per the Jul 3-9 briefings and were never moved to
the Removed table. Separately, HOOD sat at ~$114 vs a $77-80 target with no refresh, and MU's
"post-earnings dip" entry logic was superseded by the Jul 9 macro reset with no update to the row.

The functional consequence is masked because the Tier 1 union in the morning briefing has four
legs (open positions + option underlyings + watchlist + theses), and the open-positions leg was
carrying names the watchlist should have surfaced. But the watchlist as a standalone artifact was
no longer a reliable list of "things I'm considering that I don't own yet."

**Root cause:** No enforcement rule in the briefing routine. The watchlist is written by hand and
never audited.

**Resolution (2026-07-10):**

1. **Routine change:** [`investment-os/routines/morning-briefing.md`](../routines/morning-briefing.md)
   now has a `Step 2.5 — watchlist hygiene` block. Each run: (a) auto-retires any active row whose
   symbol is in the current open-position set, moving it to Removed with reason
   `converted to position`; (b) surfaces stale-target rows (price > 25% past target with no
   `updated:` within 30 days) in a `## 🧹 Watchlist hygiene` section for human review — no
   auto-mutation.

2. **Baseline reconciliation:** Watchlist rewritten. GLW / NBIS / CRWV / IREN moved to Removed
   with reason `promoted → position`. HOOD moved to Removed with reason `target invalidated`
   ($77-80 base target never touched; stock ran to $114). MU row refreshed — target changed from
   "post-earnings dip" to "reassess post SK Hynix Nasdaq listing (Jul 10) & next macro print",
   Why column updated to note the entry logic re-basing. CBRS unchanged. Watchlist now has 2
   active rows (MU, CBRS) — Step 2.5 will run against a clean baseline starting Jul 13.

**Spun-off follow-up:** See ISSUE-010 for the missing decision files (GLW / NBIS / CRWV / IREN
Jul 6-7 adds have no `decisions/*.md` file — the Removed table entries currently backlink to the
Jul 7 briefing as evidence, which is a placeholder, not a fix).

---

## ISSUE-010 — Adds on Jul 6-7 (GLW / NBIS / CRWV / IREN) have no decision files

**Discovered:** 2026-07-10 (surfaced while resolving ISSUE-009)  
**Module:** investment-os  
**File:** `investment-os/narrative/decisions/` (missing)  
**Status:** open  

**Description:**  
Four position changes were recorded across the Jul 6-9 morning briefings — GLW +125sh (running
total 175sh), NBIS +40sh, CRWV +50sh, and an IREN open — but none of them have a corresponding
file in `investment-os/narrative/decisions/`. The most recent decision file is dated 2026-06-30
(EOSU / POET). The evening briefing routine
([`investment-os/routines/evening-briefing.md`](../routines/evening-briefing.md)) is supposed to
draft a decision file for every trade not yet captured; that step evidently didn't run or didn't
capture these.

**Impact:** Medium. Ledger fills still exist (source of truth), and the briefings narrate the
reasoning, but the decisions/ folder is the canonical place to record thesis / trigger / plan / 
outcome per trade. Without those files, later reviews (post-mortem, "why did I add here?", 
lessons files) have to reconstruct intent from briefing prose, which is inefficient and 
lossy. Also breaks the schema contract in
[`investment-os/schemas/watchlist.md`](../schemas/watchlist.md) that says
"when promoting a watchlist row to a position, link the resulting decision file in the reason
(`promoted → decisions/2026-06-27-glw.md`)".

**To fix:**  
1. Backfill 4 decision files, dated per the actual add day (likely Jul 6 or Jul 7), sourcing
   thesis + trigger from the briefings and fill data from ledger entries.
2. Update the Removed table in `watchlist.md` to replace the briefing backlinks with proper
   `decisions/*.md` links once the files exist.
3. Check why the Jul 6 and Jul 7 evening briefings did not run Step 2 (draft-decision) of the
   evening routine — either the routine didn't fire, or it fired but skipped. If the latter, the
   routine's failure mode is silent, which is a separate defect.

**Acceptance criteria:**
- 4 decision files exist under `narrative/decisions/`, one per add, each with thesis / trigger /
  plan / (outcome deferred).
- `watchlist.md` Removed table backlinks point to the decision files, not the briefing.
- Root cause of the evening-briefing miss is documented (either "routine didn't run on Jul 6/7"
  or a fix to the routine's error handling).

---
