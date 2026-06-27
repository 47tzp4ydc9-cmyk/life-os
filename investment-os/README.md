# Investment OS

AI-first investment knowledge base. Brokers (IBKR, Wealthsimple) remain the source of truth for live data. This repo stores what cannot be regenerated: reasoning, theses, decisions, lessons.

## Layout

```
investment-os/
├── narrative/        # markdown — AI + human authored
│   ├── decisions/    # one file per significant action
│   ├── theses/       # one file per active position/theme
│   ├── research/     # one file per topic, append-only
│   ├── intelligence/ # AI observations, monthly
│   ├── briefings/    # generated morning/evening summaries
│   ├── watchlist.md  # ideas under consideration
│   └── action-items.md
├── data/             # SQLite — script authored
│   ├── portfolio.db  # positions, executions, snapshots
│   └── raw/          # broker dumps (gitignored)
├── scripts/          # broker sync, reconciliation, snapshots
└── schemas/          # YAML frontmatter spec per doc type
```

## What goes where

| Question                              | Read from               |
|---------------------------------------|-------------------------|
| What do I hold? What's my P&L?        | `data/portfolio.db`     |
| Why did I buy X?                      | `narrative/decisions/`  |
| What's my thesis on X?                | `narrative/theses/`     |
| What have I learned about myself?     | `narrative/intelligence/` |
| What should I do today?               | `narrative/action-items.md` |

## Write flow

- Markdown is written by you or Claude (drafts in chat, committed locally or via MCP).
- `data/portfolio.db` is written **only** by `scripts/` on a schedule or manual trigger.
- The two never write to the same place.
