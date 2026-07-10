# Routine: daily order sync

## Schedule

```
schedule:   Mon–Fri 16:30 America/Toronto
connectors: [ibkr, gmail, life-os]
writes:     investment-os/narrative/ledger/<account>.md   (append-only)
depends_on: none
blocks:     evening-briefing (which runs at 17:30 and expects today's fills to be in the ledger)
```

## What you're doing

Sync every fill executed today across all in-scope accounts into the per-account ledger files. This is the routine version of the manual [`../prompts/sync-executions.md`](../prompts/sync-executions.md) playbook, pinned to today's date range and the fast-path token rules.

## Instructions

Read [`../prompts/sync-executions.md`](../prompts/sync-executions.md) end-to-end. That is your full playbook — schema, dedupe contract, action mapping, decision back-links, commit rules, all of it. Follow it exactly.

Your invocation for this scheduled run is:

> **sync today**

Which triggers the fast-path rules in that prompt:

- Scope = all accounts in [`../../_shared/accounts.md`](../../_shared/accounts.md).
- Date range = today only (America/Toronto).
- Read only the existing ledger files for in-scope accounts; skip the decisions index unless a fill has a `broker_order_ref` you want to back-link.
- Skip the broker-notes file unless a row fails to parse.
- Skip re-reading the ledger schema if it's already in your project knowledge.

## Before you commit

Follow the "Before you commit — show me the diff" section of `sync-executions.md`. Since this is a scheduled run with no human waiting on the chat, apply this policy:

- If **0 rows are flagged as ambiguous** across all accounts → auto-commit.
- If **any row is flagged** (ambiguous action mapping, unclassifiable email, Wealthsimple `SecurityTransfer` you couldn't attribute to an account, etc.) → **do not commit any file**. Print the diff and the flagged rows into the session output and stop. The human will re-run manually.

Rationale: one bad row committed is a permanent append the human then has to reverse with a corrective entry. Better to fail loud on ambiguity.

## Success criteria

Report at the end of the session:

- Per account: file path, +N executions committed, M duplicates skipped.
- Totals across the run.
- Any decision files where `decision_ref` was auto-populated.
- If you stopped due to flagged rows: the flagged rows verbatim so the human can decide.

The routine has succeeded if either:
1. All in-scope ledger files were committed with 0 ambiguity, **or**
2. You halted at the diff step because of ambiguity and emitted a report the human can act on.

Anything else (broker connector error, life-os MCP write failure) is a failure — surface it clearly.

## Hard rules recap (from `sync-executions.md`)

- Never edit or delete existing `executions[]` entries. Reverse via an `other` entry with `related_id`.
- Never invent values. Use `null` or flag the row.
- Never use account slugs not in `_shared/accounts.md`.
- Never write credentials, account numbers, or PII into the ledger.
