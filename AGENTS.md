# Instructions for AI assistants

This file is read by Claude, ChatGPT, and other AI tools accessing this repo. Follow these rules when reading or proposing changes.

## What you may write

You may create or edit files **only** inside `*/narrative/` folders. Every narrative document must have YAML frontmatter matching the schema in `*/schemas/`.

| You write here                    | You do NOT write here              |
|-----------------------------------|------------------------------------|
| `investment-os/narrative/**`      | `investment-os/data/**` (scripts) |
| Future `workout-os/narrative/**`  | `*/scripts/**` (human-edited code) |
|                                   | `*/schemas/**` (human-edited spec) |
|                                   | Root config files                  |

## Filename conventions

- Decisions: `narrative/decisions/YYYY-MM-DD-<symbol-or-slug>.md`
- Theses: `narrative/theses/<symbol-or-theme>.md` (one per active position/theme)
- Research: `narrative/research/<slug>.md` (one file per topic, append-only sections)
- Intelligence: `narrative/intelligence/YYYY-MM-<slug>.md`
- Briefings: `narrative/briefings/YYYY-MM-DD-<morning|midday|evening>.md`
- Catalysts: `narrative/catalysts/YYYY-MM-DD-<slug>.md`
- Option positions: `narrative/options/<symbol>-<strike><p|c>-<original-expiry>.md` (filename stays the same after rolls)
- Predictions: `narrative/predictions/YYYY-MM-DD-<slug>.md`

Slugs are lowercase, hyphen-separated, ASCII only.

## Person and account slugs

Any `person:` or `account:` field MUST use a slug listed in [`_shared/accounts.md`](_shared/accounts.md). Do not invent variants (`ibkr`, `IBKR Margin`, `WS_TFSA` are all wrong). If you need a slug that doesn't exist, ask the human to add it first.

## Frontmatter rules

- Every narrative file starts with `---` YAML frontmatter, then a blank line, then markdown body.
- Required fields per type are in `investment-os/schemas/`.
- Dates use `YYYY-MM-DD`. Use `null` (not empty string) for unknown values.
- Never invent values for fields you don't have data for — omit the field or set `null`.

## When asked to write

1. Read the matching schema in `*/schemas/` first.
2. Use the canonical filename pattern above.
3. Output the full file content for the human to commit, unless write access via MCP is configured.
4. Do not modify other files in the same response unless explicitly asked.

## When asked to analyze

- Prefer reading the SQLite database (`*/data/*.db`) for quantitative questions (positions, executions, snapshots, P&L).
- Prefer reading narrative markdown for qualitative questions (why, thesis, lessons).
- Cross-reference both for "did my thesis play out" style questions.

## Hard rules

- Never write to `data/` — that's broker-imported, script-owned.
- Never delete narrative files. To retract, append a `retracted_at` field to frontmatter.
- Never store live prices, P&L, Greeks, or buying power in markdown. These belong in `data/` (regeneratable) or nowhere.
- Never include API keys, account numbers, or broker credentials anywhere in this repo.
- Never invent person or account slugs — use only those defined in [`_shared/accounts.md`](_shared/accounts.md).
