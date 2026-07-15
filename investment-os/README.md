# Investment OS

AI-first investment knowledge base. Brokers (IBKR, Wealthsimple) remain the source of truth for live data. This repo stores what cannot be regenerated: reasoning, theses, decisions, lessons.

## Layout

```
investment-os/
├── narrative/         # markdown — AI + human authored
│   ├── decisions/     # one file per significant action (buy/sell/roll/close)
│   ├── theses/        # one file per active position or theme
│   ├── options/       # one file per logical option position (extends across rolls)
│   ├── ledger/        # one file per account; append-only log of every executed fill
│   ├── research/      # one file per topic, append-only sessions with 5-filter checks
│   ├── catalysts/     # dated events (earnings, regulatory, index inclusion)
│   ├── predictions/   # dated falsifiable claims, verified later
│   ├── intelligence/  # AI observations about behavior, evidence-based, monthly
│   ├── briefings/     # generated morning / midday / evening summaries
│   ├── watchlist.md   # ideas under consideration
│   └── action-items.md
├── data/              # SQLite — script authored; derived from ledger + live broker data
│   ├── portfolio.db   # positions, snapshots, computed P&L
│   └── raw/           # broker dumps (gitignored)
├── strategies/        # investment doctrine — frameworks, rules, playbooks
├── prompts/           # ready-to-paste claude.ai prompts (sync, briefings, etc.)
├── scripts/           # broker sync, reconciliation, snapshots
└── schemas/           # YAML frontmatter spec per doc type
```

Shared references live one level up: [`../_shared/accounts.md`](../_shared/accounts.md) for canonical person + account slugs, [`../_shared/broker-notes.md`](../_shared/broker-notes.md) for broker operational quirks.

> `data/` and `scripts/` are intentionally empty for now. The ledger files in `narrative/ledger/` are the source of truth for executions; `data/portfolio.db` will be built as a derived cache (with a populator script in `scripts/`) only when query performance, complex SQL aggregations, or live-snapshot needs (prices, Greeks, buying power) require it.

## What goes where

| Question                                       | Read from               |
|------------------------------------------------|-------------------------|
| What do I hold right now? What's my live P&L?  | `data/portfolio.db`     |
| What did I trade in X, and when?               | `narrative/ledger/<account>.md` |
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
- `narrative/ledger/<account>.md` is appended to by the [sync-executions](prompts/sync-executions.md) prompt running in claude.ai, which pulls from the IBKR and Gmail connectors and dedupes against existing entries.
- `data/portfolio.db` is written **only** by `scripts/` on a schedule or manual trigger. It is a derived cache of the ledger plus live broker state — always regeneratable.
- The three never write to the same place.

## Working with Claude (claude.ai)

Set up a **Project** in claude.ai called "Investment OS". Connectors to attach:

| Connector | Purpose | Setup |
|---|---|---|
| `life-os` (custom Remote MCP) | Read + write repo files | Settings → Connectors → Add custom connector → `https://life-os-commit.9tmbv6t55v.workers.dev/mcp` with the `SHARED_SECRET` as the Bearer token. Source in [`tools/mcp-commit-worker/`](../tools/mcp-commit-worker/). |
| `SnapTrade` (hosted MCP) | Structured fallback for Wealthsimple orders / positions when Gmail parsing is ambiguous or misses a fill | Settings → Connectors → Add custom connector → `https://mcp.snaptrade.com/mcp`. OAuth flow — log into your SnapTrade Personal account, approve read scope. See "SnapTrade (Wealthsimple fallback)" below. |
| Gmail | Wealthsimple order confirmations (primary), plus news and catalyst emails | First-party |
| IBKR | Positions, P&L, live quotes | First-party |

The custom `life-os` connector exposes three tools: `commit_file`, `read_file`, `list_directory`. It's the only write path — Anthropic's first-party GitHub connector is read-only.

### SnapTrade (Wealthsimple fallback)

SnapTrade is a **structured fallback** for the Wealthsimple side. Gmail confirmation emails are the primary source — they arrive quickly and have proven reliable in practice. SnapTrade fills the gaps when Gmail is ambiguous, missing a fill, or when you need a positions/balances snapshot (which Gmail can't give you).

**One-time setup (no code):**

1. Sign up at [dashboard.snaptrade.com](https://dashboard.snaptrade.com/signup) and link Wealthsimple (and any other broker you want covered).
2. In claude.ai → **Settings → Connectors → Add custom connector** → `https://mcp.snaptrade.com/mcp`. Complete the OAuth login to SnapTrade in the browser; approve read scope.
3. Verify: ask Claude "list my SnapTrade connections" — it should show Wealthsimple + accounts.

**What Claude gets** (18 read-only tools; the ones this repo uses as fallback):

| Tool | Use when |
|---|---|
| `AccountInformation_getUserAccountRecentOrdersV2` | Gmail confirmation is ambiguous, missing, or you need to cross-check a fill |
| `AccountInformation_getAccountActivities` | reconciling dividends / deposits / fees Gmail may have missed |
| `AccountInformation_getAllAccountPositions` | snapshot of WS positions (Gmail can't provide this) |
| `AccountInformation_getUserAccountBalance` | snapshot of WS cash + buying power |
| `Connections_listBrokerageAuthorizations` | confirming the WS connection is still authorized |

**No secrets in claude.ai.** The hosted MCP uses OAuth 2.0 + PKCE. Your SnapTrade `userId` / `userSecret` never leave SnapTrade; Claude only receives short-lived, read-scoped access tokens. Revoke any time at SnapTrade dashboard → Settings → Connected apps.

**Programmatic / local script use (optional).** If you later want scripts under `scripts/` to hit the SnapTrade Partner API directly (e.g. to snapshot `data/portfolio.db`), fill the four `SNAPTRADE_*` vars in [`../.env.example`](../.env.example). Not needed for the Claude workflow above.

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

### Scheduled briefings

The morning and evening briefing prompts are canonical files under [`routines/`](routines/), not inlined here. Edit them there — this README should never fork them.

| Trigger | Canonical prompt | Schedule |
|---|---|---|
| `morning briefing` | [`routines/morning-briefing.md`](routines/morning-briefing.md) | Mon–Fri, 06:30 ET |
| `evening wrap` | [`routines/evening-briefing.md`](routines/evening-briefing.md) | Mon–Fri, 17:30 ET |

To schedule: claude.ai → **Settings → Tasks/Routines → Create** → set the trigger and paste the session prompt below (do **not** paste the routine body — the file is read fresh each run so edits take effect immediately).

```
Read investment-os/routines/morning-briefing.md via the life-os connector and follow it exactly. Autonomous run — commit when ready.
```

(Substitute `evening-briefing.md` for the evening job.) Make sure the Project is "Investment OS" so the system prompt + connectors are loaded.

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
