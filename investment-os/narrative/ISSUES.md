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
