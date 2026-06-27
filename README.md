# Life OS

Personal knowledge repository optimized for read/write by AI assistants (Claude, ChatGPT) via their GitHub connectors.

## Modules

- [`investment-os/`](investment-os/) — investment decisions, theses, research, broker data
- `workout-os/` — *(planned)*

## How it works

- **Narrative** (markdown, human + AI authored) lives in each module's `narrative/` folder. Source of truth for reasoning, decisions, lessons.
- **Data** (SQLite, CSV — script-authored only) lives in each module's `data/` folder. Source of truth for facts imported from external systems.
- **Scripts** (`scripts/`) sync external systems into `data/`. AI does not write here.
- **Schemas** (`schemas/`) define the YAML frontmatter shape for each narrative document type.

AI assistants should read [`AGENTS.md`](AGENTS.md) before writing anything.

## Local setup

This repo uses a local git identity (configured per-repo, not globally) so commits are attributed to the personal GitHub account, never the enterprise one.
