# Schema: action-items

Open tasks. Single file. Completed items move to the bottom, never deleted — so the AI can learn what gets done vs ignored.

**Path:** `narrative/action-items.md`

## Frontmatter

```yaml
---
type: action-items
updated: 2026-06-27
---
```

## Format

Each task is a single-line checkbox with inline `key:value` tags.

```markdown
## Open

- [ ] roll RKLB Aug21 105P down to 95P `priority:high` `due:2026-08-01` `related:RKLB` `account:ibkr_margin`
- [ ] check WDC after-hours news `priority:medium` `due:2026-06-28` `related:WDC` `account:ws_janisha_margin`

## Completed

- [x] cancel stale BMNR BTC limit @ $5 `completed:2026-06-27`
```

## Tags

- `priority`: `high | medium | low` (treat as 🔴 / 🟡 / 🟢)
- `due`: ISO date — omit if no hard deadline
- `related`: symbol or catalyst slug
- `account`: account slug from `_shared/accounts.md`
- `completed`: ISO date — only on completed items

## Rules

- Never delete items. Move to `## Completed` with a `completed:` tag.
- Items older than 30 days under `## Open` should be reviewed in the next briefing — acted on, rescoped, or moved to Completed with a reason.
