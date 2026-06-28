# Investment OS

AI-first investment knowledge base. Brokers (IBKR, Wealthsimple) remain the source of truth for live data. This repo stores what cannot be regenerated: reasoning, theses, decisions, lessons.

## Layout

```
investment-os/
├── narrative/         # markdown — AI + human authored
│   ├── decisions/     # one file per significant action (buy/sell/roll/close)
│   ├── theses/        # one file per active position or theme
│   ├── options/       # one file per logical option position (extends across rolls)
│   ├── research/      # one file per topic, append-only sessions with 5-filter checks
│   ├── catalysts/     # dated events (earnings, regulatory, index inclusion)
│   ├── predictions/   # dated falsifiable claims, verified later
│   ├── intelligence/  # AI observations about behavior, evidence-based, monthly
│   ├── briefings/     # generated morning / midday / evening summaries
│   ├── watchlist.md   # ideas under consideration
│   └── action-items.md
├── data/              # SQLite — script authored
│   ├── portfolio.db   # positions, executions, snapshots
│   └── raw/           # broker dumps (gitignored)
├── strategies/        # investment doctrine — frameworks, rules, playbooks
├── scripts/           # broker sync, reconciliation, snapshots
└── schemas/           # YAML frontmatter spec per doc type
```

Shared references live one level up: [`../_shared/accounts.md`](../_shared/accounts.md) for canonical person + account slugs, [`../_shared/broker-notes.md`](../_shared/broker-notes.md) for broker operational quirks.

## What goes where

| Question                                       | Read from               |
|------------------------------------------------|-------------------------|
| What do I hold? What's my P&L?                 | `data/portfolio.db`     |
| What's the running state of an option I rolled?| `narrative/options/`    |
| Why did I buy X?                               | `narrative/decisions/`  |
| What's my thesis on X?                         | `narrative/theses/`     |
| When is the next catalyst on X?                | `narrative/catalysts/`  |
| Did the 5-filter check pass for X?             | `narrative/research/`   |
| What did I (or the AI) predict about X?        | `narrative/predictions/`|
| What have I learned about myself?              | `narrative/intelligence/` |
| What should I do today?                        | `narrative/action-items.md` |
| What framework decides if a new idea is worth a buy? | `strategies/five-filter.md` |

## Write flow

- Markdown is written by you or Claude (drafts in chat, committed locally or via MCP).
- `data/portfolio.db` is written **only** by `scripts/` on a schedule or manual trigger.
- The two never write to the same place.

## Working with Claude (claude.ai)

Set up a **Project** in claude.ai called "Investment OS". Connectors to attach:

| Connector | Purpose | Setup |
|---|---|---|
| `life-os` (custom Remote MCP) | Read + write repo files | Settings → Connectors → Add custom connector → `https://life-os-commit.9tmbv6t55v.workers.dev/mcp` with the `SHARED_SECRET` as the Bearer token. Source in [`tools/mcp-commit-worker/`](../tools/mcp-commit-worker/). |
| Gmail | Wealthsimple confirmations, news | First-party |
| IBKR | Positions, P&L, live quotes | First-party |

The custom `life-os` connector exposes three tools: `commit_file`, `read_file`, `list_directory`. It's the only write path — Anthropic's first-party GitHub connector is read-only.

### Project system prompt

Paste this as the Project's custom instructions. It primes every new chat without re-uploading files.

```
Repo: 47tzp4ydc9-cmyk/life-os, branch main.

Before any write, read AGENTS.md and the matching schema in
investment-os/schemas/. Use only person and account slugs from
_shared/accounts.md — never invent variants.

Before evaluating any new stock idea (buy, watchlist add, conviction
change), apply the framework in investment-os/strategies/five-filter.md.
Record scores per the rules in that file. Do not invent alternative
frameworks — if the five filters feel wrong, raise it as a question.

When I describe a trade, decision, or observation in chat, draft the
corresponding narrative file using the naming convention in AGENTS.md,
show it to me, and on my confirm commit it via the life-os connector's
commit_file tool with a one-line message like:
  decision: <symbol> <action> <date>
  thesis: <symbol> initial
  catalyst: <symbol> <event>

Never write to investment-os/data/. Never modify investment-os/schemas/,
investment-os/strategies/, or _shared/ without me asking explicitly.
Never delete narrative files — to retract, append a retracted_at field
to the frontmatter.

For quantitative questions (P&L, positions, fills) use IBKR + Wealthsimple
data, not narrative files. For "why did I do X" or "what's my thesis"
questions, read the narrative.
```

### Morning briefing prompt

**Runs autonomously** as a claude.ai scheduled routine (6am ET pre-market). Same prompt works manually — trigger phrase: **"morning briefing"**. Both paths commit without confirmation.

```
Generate today's pre-market briefing for investment-os. Autonomous run —
do not ask for confirmation, commit when ready.

Step 1 — Read repo state via life-os MCP:
- AGENTS.md
- investment-os/schemas/briefing.md (THIS IS THE OUTPUT CONTRACT — follow exactly)
- investment-os/narrative/action-items.md (open items only)
- every file in investment-os/narrative/options/ with status: open
- every file in investment-os/narrative/catalysts/ with event_date in next 14d
- investment-os/narrative/watchlist.md
- the most recent file in investment-os/narrative/briefings/ for delta

Step 2 — Define Tier 1 universe (the names that must be checked):
- All open option positions
- Top 10 equity positions by exposure (notional × |delta|)
- All watchlist entries with target_entry set
For each Tier 1 name, also load narrative/theses/<symbol>.md if it exists.

Step 3 — Pull live data:
- IBKR: positions, working orders, NLV, leverage, cash, buying power
- Gmail: Wealthsimple confirmations since prior briefing (mine + Janisha's forwarded)

Step 4 — Per Tier 1 name, fetch news (last 24h):
- web_search: "<TICKER> news last 24 hours"
- SEC EDGAR: any 8-K filed since prior briefing
- Classify each material item on six dimensions per schemas/briefing.md:
  type, direction, magnitude, technical impact, thesis impact, suggested action
- Skip filler (press release rehashes, generic "stock moves on X" articles)

Step 5 — Severity-rank into 🔴 action / 🟡 monitor / 🟢 quiet per schemas/briefing.md.

Step 6 — Early-exit:
If 🔴 = 0 AND 🟡 ≤ 1 AND no catalyst firing today AND SPY pre-market move < 1%,
write the short-form briefing (frontmatter + Quick Read + one-line quiet status)
and stop. Do not pad.

Step 7 — Compose the briefing using the rich format in schemas/briefing.md
(tables, tags, severity sections). Commit via life-os commit_file to
investment-os/narrative/briefings/YYYY-MM-DD-morning.md with message
"briefing: YYYY-MM-DD morning".

Step 8 — For each 🔴 name, append exactly one action-item to action-items.md
with priority:high and due:today. Then mirror those in the briefing's
"Action items added" section.

Hard rules:
- Do not invent news. Empty web search result = 🟢.
- Do not write outside narrative/. Do not modify schemas/, strategies/, or _shared/.
- One briefing per session per day. Do not overwrite — corrections via the
  ## Correction pattern documented in schemas/briefing.md.
- If commit_file fails, retry once. If it still fails, output the briefing as
  a chat message tagged "BRIEFING-FALLBACK" so I can paste it in manually.
```

To schedule: claude.ai → **Settings → Tasks/Routines → Create** → paste the prompt above → set cron `0 6 * * 1-5` (6am ET, weekdays). Make sure the Project is "Investment OS" so the system prompt + connectors are loaded.

### Evening briefing prompt

Trigger phrase: **"evening wrap"**.

```
Generate today's evening briefing for investment-os.

Same read pattern as morning. Additional work:

- Compute today's realized P&L from today's Wealthsimple and IBKR fills.
- For each decision I made today that does not yet have a file in
  investment-os/narrative/decisions/, draft one matching the schema,
  show me, and commit on confirm. Use date in filename = trade date.
- For any option position closed today, update its file in
  investment-os/narrative/options/ (status, closed, realized_pnl_total)
  and fill the outcome block on the linked decision file.
- For any prediction in investment-os/narrative/predictions/ whose
  verify_on is today or earlier, fill its outcome and set verified: true.
- Surface anything notable for tomorrow (catalysts firing, expirations,
  watchlist names that hit target entry).

Commit briefing to investment-os/narrative/briefings/YYYY-MM-DD-evening.md.
```

### Decision-capture prompt (mid-day, ad-hoc)

Trigger phrase: **"capture decision"** — use after you make a trade in chat and want it persisted before the evening wrap.

```
Capture the decision I just described as a narrative file.

1. Read investment-os/schemas/decision.md.
2. Read AGENTS.md and _shared/accounts.md for filename + slug rules.
3. If it involves an option, also read investment-os/schemas/option-position.md
   — you'll need both a decision file and an option-position file (or an
   update to an existing one for a roll/close).
4. Draft the file(s) with the trade details I gave you. Set today's
   created/updated. Leave outcome and lessons null.
5. Show me the draft. On my confirm, commit with message:
   "decision: <symbol> <action> <date>"
```

### Lessons / intelligence prompt

Trigger phrase: **"intelligence note"** — use at end of week or after a meaningful win/loss to capture behavioral patterns.

```
Draft an intelligence note for this month, per
investment-os/schemas/intelligence.md.

1. Read the last 2 weeks of decisions and any new closed positions.
2. Identify recurring patterns I exhibited — sizing tendencies,
   entry-timing habits, exit discipline, repeated mistakes.
3. Stick to observations grounded in specific decisions (reference
   them by filename). No advice, no predictions — predictions go
   in narrative/predictions/.
4. Save to investment-os/narrative/intelligence/YYYY-MM-<slug>.md and
   commit.
```

### Token-efficiency notes

- The Project system prompt + AGENTS.md + the schemas folder fit comfortably under 10k tokens. Don't paste them into individual chats — the Project keeps them resident.
- Inside any chat, ask Claude to **list filenames first, then read only the ones it needs**. The "every file in X with status: Y" pattern in the morning prompt does this implicitly.
- Once the repo grows past ~50 narrative files, replace the "read every file in X" steps with index-style queries — have a script generate `narrative/index.json` nightly and read that first.
