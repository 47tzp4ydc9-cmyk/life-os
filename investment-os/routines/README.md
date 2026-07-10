# Routines

Scheduled Claude jobs. Each file here is a **self-contained prompt** meant to be pasted into a scheduled Claude Code session (or run manually when you want the same behavior).

Distinction from `../prompts/`:

| Folder | Contents | Invocation |
|---|---|---|
| `prompts/` | Reusable playbooks that take arguments (e.g. `sync-executions.md` — "sync today", "backfill NVDA everywhere") | Manual, argument-driven |
| `routines/` | Scheduled jobs. Thin wrappers with fixed arguments + a schedule | Cron / Claude scheduled sessions |

A routine may reference a prompt. For example, [`daily-order-sync.md`](./daily-order-sync.md) tells the scheduled session to invoke [`../prompts/sync-executions.md`](../prompts/sync-executions.md) with `sync today`.

## Current routines

| File | Schedule (ET) | What it produces |
|---|---|---|
| [`daily-order-sync.md`](./daily-order-sync.md) | Mon–Fri, **16:30** | Appends today's fills to `narrative/ledger/<account>.md` |
| [`morning-briefing.md`](./morning-briefing.md) | Mon–Fri, **06:30** | Writes `narrative/briefings/YYYY-MM-DD-morning.md` |
| [`evening-briefing.md`](./evening-briefing.md) | Mon–Fri, **17:30** | Writes `narrative/briefings/YYYY-MM-DD-evening.md` |

Ordering rationale: **daily sync runs first (16:30)** so the evening briefing (17:30) sees today's fills already in the ledger. The morning briefing runs its own inline sync at the top to catch overnight confirmation emails and pre-market IBKR activity.

## How to schedule (Claude Code)

Each routine's frontmatter records its intended schedule. To wire it up in Claude Code:

1. Open a scheduled session.
2. Set the trigger to the ET time in the routine's `schedule` field.
3. As the session prompt, use:
   > Read `investment-os/routines/<filename>.md` from the `life-os` connector and follow it exactly.
4. Ensure the required connectors listed in the routine's `connectors` field are enabled on the session's project.

Routines write via the `life-os` MCP's `commit_file`. Existing files are protected — routines that generate a new file per run (both briefings) will fail idempotently if the file already exists, which is the desired behavior (one briefing per session per day).

## Rules for adding a new routine

- One file per scheduled job. Do not overload one routine with multiple unrelated tasks.
- Start the file with a schedule metadata block (see existing files as templates).
- List required connectors explicitly. Do not assume the scheduled session has them.
- Reference schemas by path — do not duplicate schema definitions inline.
- End with an unambiguous success criterion so the scheduled session knows when it's done.
- If the routine writes to `narrative/`, use the exact filename pattern from `../schemas/`.
