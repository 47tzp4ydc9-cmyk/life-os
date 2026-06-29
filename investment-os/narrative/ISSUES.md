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
