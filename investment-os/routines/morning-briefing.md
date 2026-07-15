# Routine: morning briefing

## Schedule

```
schedule:   Mon–Fri 06:30 America/Toronto  (~3h before US open)
connectors: [ibkr, gmail, snaptrade, life-os, web_search]
              # gmail    = primary for Wealthsimple order confirmations + news
              # snaptrade = hosted MCP at https://mcp.snaptrade.com/mcp (fallback + positions/balances snapshot for WS)
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

## Step 1 — pull portfolio state

**IBKR** (direct connector):

- NLV, leverage, cash by currency, buying power, excess liquidity.
- Open positions (equities + options).
- Open orders (working / GTC).
- Realized + unrealized P&L for the trailing session, if IBKR exposes it.

**Wealthsimple** (Gmail primary, SnapTrade fallback):

- **Gmail (primary):** Wealthsimple order-confirmation emails since the prior briefing's `generated_at`. These are the source of truth for fills.
- **SnapTrade MCP (fallback + snapshot):** call `AccountInformation_getUserAccountBalance` and `AccountInformation_getAllAccountPositions` per WS account for a positions/cash snapshot (Gmail can't give you this). Also call `AccountInformation_getUserAccountRecentOrdersV2` **only if** Gmail returned an ambiguous confirmation or you have reason to believe a fill was missed — use it to cross-check, not to duplicate.
- If SnapTrade is unavailable (`disabled` connection, timeout, empty response), proceed with Gmail + last-known ledger state and note "SnapTrade unavailable; WS positions/balances may be stale" — do not silently drop WS from the briefing.
- On conflicts between Gmail and SnapTrade for the same order, prefer Gmail's fill (it's the primary) and flag the discrepancy in the coverage note.

## Step 2 — build the Tier 1 universe (names you must sweep)

Union of:

- All open stock positions across every account in [`../../_shared/accounts.md`](../../_shared/accounts.md).
- All open option underlyings.
- All symbols in [`../narrative/watchlist.md`](../narrative/watchlist.md) with `status: active`.
- All symbols with a file in `narrative/theses/`.
- Any symbol referenced in an unresolved 🔴 or 🟡 item from the prior briefing.

Any Tier 1 name is guaranteed a classification — do not silently skip.

## Step 2.5 — watchlist hygiene (ISSUE-009 fix)

The watchlist rots when entries become positions or their entry logic goes stale. Enforce two rules each run:

1. **Auto-retire converted entries.** For each row in [`../narrative/watchlist.md`](../narrative/watchlist.md) with `status: active`, if the symbol appears in the current open-position set from Step 1, move the row to the Removed table with `reason: converted to position` and `removed_on: <today>`. Do not fetch news for it as a watchlist item — it's already covered via the open-positions leg of Tier 1. Bump the file's `updated:` to today only if at least one row moved. Commit the watchlist edit in the same commit as the briefing; extend the commit message to `briefing: morning YYYY-MM-DD (…) + watchlist hygiene`.

2. **Surface stale targets, do not mutate.** For each remaining active row, if the current price is more than 25% past `target_entry` in the wrong direction (i.e. for a buy setup, price has run far above target with no `updated:` refresh in ≥ 30 days), append a line to a `## 🧹 Watchlist hygiene` section of the briefing naming the row and proposing one of: refresh target, move to Removed with reason `target invalidated`, or convert to thesis. **Do not auto-edit the row** — this requires human judgment. Omit the section if nothing qualifies.

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

## Step 5.5 — security & margin-call items: two-line cap

Security-alert and margin-call items are chronic. They recurred at 🔴 for four consecutive sessions in early July on false-positive premises, dominating briefings that were meant to be about trade decisions. Apply these caps every run:

1. **Single `## 🛡️ Security & margin` section, ≤ 2 lines total.** Placed after 🟢 Quiet and before Catalysts. One bullet per open item, of the form: `- **<slug>** — <status> · <one-line next action>`. No tables, no "why this matters" prose, no repeated background, no dramatic emojis (⚠️ 🚨 etc.) beyond the section header.

2. **Only 🔴 on a fresh, unacknowledged trigger.** A security / margin / account-integrity item may appear in the 🔴 section ONLY if BOTH hold: (a) a new broker alert email, actual account lock, forced-liquidation notice, or unattributed auth event landed *this cycle*, AND (b) it has not been marked as authorized / resolved / not-an-incident in any prior briefing's `## Correction` block or in `action-items.md` as completed. Otherwise the item belongs in the compressed 🛡️ section.

3. **Repetition is not evidence.** Phrases like "Nth consecutive night", "4th time this week", or "pattern continues" are observations, not a fresh trigger. They do not qualify under rule 2. New evidence means an incoming alert or event with its own timestamp — not the mere continuation of activity the user has already acknowledged.

## Step 5.6 — prior Corrections are binding

Before drafting any 🔴 sub-block, scan the last 5 briefings for `## Correction` blocks referencing the item or symbol. If the user has marked something as resolved, authorized, decided, or a false positive, that ruling is **binding forward**: do not re-litigate it. Downgrade severity to whatever the correction implied (🟡 monitor if the item is still live but no longer requires action; omit entirely if the correction said "resolved / closed"). This applies to SMCI-style "day N still undecided" carry-forwards just as much as to security items. If unsure whether a correction still applies (e.g. new material development), state that uncertainty in one line and default to the lower severity — never restate a resolved item as if the correction never happened.

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

### Readability requirements (from the schema — enforce every run)

- `> 📌 TL;DR` block immediately after frontmatter (unless quiet-day early exit). Max 3 imperative lines, one per 🔴 item — or top 3 🟡 items if `red_count == 0`.
- `> 🔗 Links` blockquote immediately below TL;DR: `repo` (GitHub blob URL to this exact file) · `prior` (previous briefing filename on disk) · `action items` · `watchlist`.
- Quick Read table is followed by a **required** `**What changed since prior:**` bullet list (2-5 discrete observations). Do not write a wall-of-text intro paragraph.
- Every 🔴 sub-block has a muted-italics backlink line under its title: `*[thesis](...) · [decision](...) · [catalyst](...)*` — include only files that actually exist.
- If a 🔴 item has been carried in ≥ 3 consecutive briefings without a meaningful change, apply the schema's stale-item compression: replace the "why this matters" paragraph with the one-liner `> Same call as [prior briefing](./YYYY-MM-DD-<session>.md) — day N carrying. New today: <one line or "nothing">.`
- If `yellow_count > 10`, split the 🟡 table by theme with `#### <theme>` sub-headers.
- Catalysts landing within the next 5 trading days stay visible; everything further out goes inside `<details><summary>Later (N events)</summary>`.
- Use `−` (U+2212) for negative numbers, `+` for positive. Never plain `-` for numeric signs.

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
