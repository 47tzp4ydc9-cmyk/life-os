# Routine: evening briefing

## Schedule

```
schedule:   Mon–Fri 17:30 America/Toronto  (~90 min after US close, after AH settles)
connectors: [ibkr, gmail, life-os, web_search]
              # sec_edgar optional
writes:     investment-os/narrative/briefings/YYYY-MM-DD-evening.md
            investment-os/narrative/action-items.md    (append)
depends_on: daily-order-sync (which runs at 16:30 and should already have committed today's fills to the ledger)
```

## What you're doing

Produce the end-of-day briefing. Same schema as morning ([`../schemas/briefing.md`](../schemas/briefing.md)); different emphasis: today's P&L, what actually happened vs the morning plan, after-hours moves, and tomorrow's setup.

## Required reading (in this order)

1. [`../../AGENTS.md`](../../AGENTS.md) — hard rules for AI writes.
2. [`../schemas/briefing.md`](../schemas/briefing.md) — the source of truth for structure and severity.
3. [`../schemas/action-items.md`](../schemas/action-items.md).
4. **This morning's briefing** at `investment-os/narrative/briefings/YYYY-MM-DD-morning.md`. You are reporting against the plan it laid out — reference which 🔴 items resolved, which 🟡 items escalated, which quiet names had news.

## Step 0 — sanity-check the daily sync

The [`daily-order-sync.md`](./daily-order-sync.md) routine should have run at 16:30. Confirm each account's ledger `last_synced_at` is from today. If any account is stale, re-run the sync for that account before proceeding (invoke [`../prompts/sync-executions.md`](../prompts/sync-executions.md) with `sync account <slug>`). If the sync flags ambiguous rows, note them and continue — the briefing must still be written.

## Step 1 — pull end-of-day portfolio state (IBKR)

- Closing NLV, leverage, cash by currency.
- **Today's realized P&L** (per-symbol if IBKR exposes it, else total).
- Today's unrealized P&L change (mark-to-market delta vs prior close).
- Any open orders that did **not** fill (working / cancelled / expired).
- Assignments or expirations that hit today.

Wealthsimple accounts: use ledger positions + last available quote. Note "close-of-day quote is stale for WS positions" when relevant.

## Step 2 — build the Tier 1 universe

Same union as the morning briefing:

- All open stock positions.
- All open option underlyings.
- Watchlist actives.
- All symbols with a thesis file.
- Any 🔴 or 🟡 from this morning's briefing (must be reported against).
- Any symbol that had a fill today (from the ledger sync).

## Step 3 — news sweep

Since this morning's `generated_at`:

- Regular-hours news and price moves for Tier 1 names.
- Post-close news, earnings releases, guidance updates, 8-Ks.
- After-hours price + change vs regular close (as of ~17:30 ET).
- Analyst rating / PT changes issued today.

## Step 4 — catalysts

Read `narrative/catalysts/`. Any catalyst that:

- Fired today → mark it as such in the relevant name's section, describe the outcome, update thesis-impact tag.
- Is firing tomorrow → include in the `🎯 Catalysts firing today / tomorrow` section (as "tomorrow").

## Step 5 — classify each Tier 1 name

Apply the severity rules from `../schemas/briefing.md`. For the evening briefing specifically, add these framing rules:

- A name that closed **through a stop or target** today = 🔴 (reconciliation needed even if the fill already happened — the ledger has the fill, but the decision to act tomorrow may still be open).
- A name with **after-hours news moving >5%** = 🔴 for tomorrow's open, even if intraday was quiet.
- A name whose morning classification was 🔴 or 🟡 but whose situation resolved cleanly today = 🟢 with a one-line "resolved: <how>" note. Do not silently drop it.

## Step 6 — apply the early-exit rule

Per `../schemas/briefing.md`, same as morning. If today was truly quiet AND tomorrow has no catalysts AND SPY closed flat, write only frontmatter + Quick Read + a resolution note and stop.

## Step 7 — write the briefing file

Commit via `life-os` MCP's `commit_file`:

- **Path:** `investment-os/narrative/briefings/YYYY-MM-DD-evening.md` (today's date).
- **Frontmatter:** `session: evening`, `trigger: routine`, `generated_by: claude`, `generated_at: <ISO with ET offset>`, `sources: [...]` populated with what you actually used.
- **Quick Read table:** deltas are vs this **morning's** briefing (not vs yesterday).
- **Body:** same section order as morning. Additionally, if any morning 🔴 items resolved during the day, note the resolution inline (e.g. "morning 🔴 for RKLB — decided to hold, will roll Monday").
- **Commit message:** `briefing: evening YYYY-MM-DD (<red>R/<yellow>Y/<green>G, status:<...>, dayPnL:<±$X>)`

If the file already exists, **stop and report**. Do not overwrite.

## Step 8 — append action items

For every 🔴 name that needs a decision tomorrow, append to `narrative/action-items.md`. Mirror in the briefing's `## ✅ Action items added` section. Mark any morning-added items that were resolved today as `[x]` (completed) in `action-items.md`.

## Success criteria

- `investment-os/narrative/briefings/YYYY-MM-DD-evening.md` exists with schema-valid content.
- Every 🔴 and 🟡 from this morning is explicitly addressed (resolved / escalated / carried).
- Day P&L is in the Quick Read table.
- Every Tier 1 name is in exactly one severity bucket.
- Action items appended for every 🔴 tomorrow-item; morning items resolved today marked complete.
- Session output includes: briefing path, counts, day P&L, and any lingering data-quality flags from the sync.

## Hard rules

- Never write to `data/` or `scripts/`.
- Never invent news or numbers.
- Never use account slugs not in `_shared/accounts.md`.
- Never overwrite an existing briefing.
- Never edit or delete a ledger `executions[]` entry — that's the sync routine's territory, and even it may only append.
