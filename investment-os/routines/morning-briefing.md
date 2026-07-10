# Routine: morning briefing

## Schedule

```
schedule:   Mon–Fri 06:30 America/Toronto  (~3h before US open)
connectors: [ibkr, gmail, life-os, web_search]
              # sec_edgar optional; use if available for 8-K sweeps
writes:     investment-os/narrative/briefings/YYYY-MM-DD-morning.md
            investment-os/narrative/action-items.md    (append)
depends_on: prior evening briefing (for continuity)
```

## What you're doing

Produce the pre-market briefing for today. Output must conform exactly to [`../schemas/briefing.md`](../schemas/briefing.md) — that schema is the source of truth for structure, sections, tag vocabulary, severity rules, and the early-exit rule. Do not paraphrase it.

## Required reading (in this order)

1. [`../../AGENTS.md`](../../AGENTS.md) — hard rules for AI writes.
2. [`../schemas/briefing.md`](../schemas/briefing.md) — the exact schema this file must satisfy.
3. [`../schemas/action-items.md`](../schemas/action-items.md) — how new items get appended.
4. **Most recent prior briefing** in `investment-os/narrative/briefings/` — usually yesterday's evening file. This gives you carryover context (open questions, unresolved 🔴 items, catalysts that fired overnight).

## Step 0 — sync overnight fills first

Before generating the briefing, sync any orders that filled overnight or before the session started. Follow [`daily-order-sync.md`](./daily-order-sync.md) but scoped to **since the prior briefing's `generated_at`** (approximately the last 14 hours). This ensures the briefing sees fresh fills.

If the sync flags ambiguous rows, note them in the briefing's `## 🔴 Action today` section as a "reconcile these fills with me" item — do not block the briefing generation.

## Step 1 — pull portfolio state (IBKR)

- NLV, leverage, cash by currency, buying power, excess liquidity.
- Open positions (equities + options).
- Open orders (working / GTC).
- Realized + unrealized P&L for the trailing session, if IBKR exposes it.

Wealthsimple accounts have no live connector — pull last-known state from the most recent ledger entries and note "no live feed" for those positions.

## Step 2 — build the Tier 1 universe (names you must sweep)

Union of:

- All open stock positions across every account in [`../../_shared/accounts.md`](../../_shared/accounts.md).
- All open option underlyings.
- All symbols in [`../narrative/watchlist.md`](../narrative/watchlist.md) with `status: active`.
- All symbols with a file in `narrative/theses/`.
- Any symbol referenced in an unresolved 🔴 or 🟡 item from the prior briefing.

Any Tier 1 name is guaranteed a classification — do not silently skip.

## Step 3 — news sweep

For each Tier 1 symbol, via `web_search` (and `sec_edgar` if available):

- News published since the prior briefing's `generated_at`.
- Analyst rating / PT changes.
- 8-Ks and other filings.
- Sector-wide catalysts (commodity moves, peer earnings).
- Pre-market price + change vs prior close.

If web search returns nothing material for a name, that name is 🟢. **Do not invent news.**

## Step 4 — check catalysts

Read `narrative/catalysts/`. Any catalyst with `event_date` = today or tomorrow feeds:

- The `🎯 Catalysts firing today / tomorrow` section.
- The severity classification (a `break`/`binary` thesis with catalyst today = 🔴).

## Step 5 — classify each Tier 1 name

Apply the severity rules from `../schemas/briefing.md` (🔴 ACTION / 🟡 MONITOR / 🟢 QUIET) exactly as written. Do not invent new severity criteria.

## Step 6 — apply the early-exit rule

Per `../schemas/briefing.md`:

> If 🔴 = 0 AND 🟡 ≤ 1 AND no catalyst firing today AND SPY pre-market move < 1%, write only frontmatter + Quick Read + `> Status: 🟢 quiet day — no action required.` and stop.

A short briefing is a feature, not a bug. Do not pad.

## Step 7 — write the briefing file

Commit via the `life-os` MCP's `commit_file`:

- **Path:** `investment-os/narrative/briefings/YYYY-MM-DD-morning.md` (today's date, America/Toronto).
- **Frontmatter:** all fields from `../schemas/briefing.md`. `session: morning`, `trigger: routine`, `generated_by: claude`, `generated_at: <ISO with -04:00 or -05:00 offset>`, `sources: [...]` populated with what you actually used.
- **Body:** sections in the order specified by the schema. Omit empty sections except `## ⚡ Quick read`.
- **Commit message:** `briefing: morning YYYY-MM-DD (<red>R/<yellow>Y/<green>G, status:<action|monitor|quiet>)`

If the file already exists, **stop and report** — the routine already ran. Do not overwrite; use the schema's `## Correction` pattern via a manual session if needed.

## Step 8 — append action items

For each 🔴 name that requires a decision today, append an entry to `narrative/action-items.md` following [`../schemas/action-items.md`](../schemas/action-items.md). Mirror those additions into the briefing's `## ✅ Action items added` section.

## Success criteria

- `investment-os/narrative/briefings/YYYY-MM-DD-morning.md` exists in the repo with schema-valid frontmatter and body.
- Every Tier 1 name is accounted for in exactly one severity bucket.
- No fabricated news (every claim traceable to a source you actually fetched).
- Action items appended for every 🔴 item.
- Session output includes: briefing URL/path, red/yellow/green counts, and a one-line note if the overnight sync flagged anything.

Anything else — connector failure, `commit_file` refusal, missing schema fields — is a failure. Surface it verbatim.

## Hard rules

- Never write to `data/` or `scripts/`.
- Never invent news or numbers you didn't pull from a live source.
- Never use account slugs not in `_shared/accounts.md`.
- Never overwrite an existing briefing file — use the `## Correction` pattern instead (handled in a manual session, not this routine).
