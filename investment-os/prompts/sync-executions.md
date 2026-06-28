# Prompt: sync executions

Paste this into a claude.ai chat in the **Investment OS** project. Requires these connectors enabled on the project:

- **IBKR** (first-party Anthropic connector) — pulls executed orders
- **Gmail** (first-party) — for Wealthsimple confirmations and any IBKR notification emails
- **life-os** (custom Remote MCP) — reads existing ledger files and commits the updated ones

The same prompt covers three jobs: ongoing sync, single-account backfill, and single-symbol backfill (e.g. populating one ticker's full history from before this system existed). Tell Claude which one you want when you invoke it.

---

You are syncing my executed trades into per-account ledger files at `investment-os/narrative/ledger/<account>.md`.

## What you're doing

For each in-scope account, pull every executed fill from IBKR and / or Gmail, dedupe against what's already in the ledger, and append the new ones via the `life-os` connector's `commit_file` tool. Never edit or delete existing entries.

## Scope (ask me if unclear)

Default scope: all accounts in [`_shared/accounts.md`](../../_shared/accounts.md), date range = each account's `last_synced_at` to today.

I may override with one of:

- **"sync since YYYY-MM-DD"** → use that date as the lower bound for all accounts.
- **"sync account `<slug>`"** → only that one account.
- **"backfill `<symbol>` in `<account>`"** → ignore date bounds; pull every fill for that symbol in that account, from the broker's earliest available history.
- **"backfill `<symbol>` everywhere"** → same, across all accounts.

If you're not sure which mode I want, ask before fetching anything.

## Required reading before you fetch

Read these in this order. Do not skip.

1. [`AGENTS.md`](../../AGENTS.md) — the hard rules. You may write only inside `narrative/`.
2. [`_shared/accounts.md`](../../_shared/accounts.md) — canonical account slugs. Never invent variants.
3. [`investment-os/schemas/ledger.md`](../schemas/ledger.md) — the exact frontmatter, action enum, and idempotency contract you must follow.
4. [`investment-os/_shared/broker-notes.md`](../../_shared/broker-notes.md) if it exists — broker quirks.

For each account in scope, also read the current ledger file via the `life-os` connector's `read_file` tool:

- Path: `investment-os/narrative/ledger/<account>.md`
- If the file does not exist, you will create it. Use the template at the bottom of this prompt.
- Build a **set of existing `id` values** from `executions[].id`. This is your dedupe set.

Also list `investment-os/narrative/decisions/` and read any decision file whose `broker_order_ref` matches a fill you're about to append — that's how you'll back-fill `decision_ref` on the execution.

## How to fetch

**IBKR connector**, per in-scope IBKR account:

- Call the connector's "list executions" / "trades" endpoint for the date range.
- Include all instruments: stocks, ETFs, options, crypto if present.
- Include adjustment-type rows: dividends, interest, fees, transfers, assignments, expirations.
- For each row, capture: trade date, action verb, symbol, quantity (always positive — sign comes from action), price per share, fees, net cash impact, currency, IBKR order id, IBKR execution id, and any option contract details (right, side, strike, expiry).

**Gmail connector**, per in-scope Wealthsimple account (and any IBKR account where Flex/connector data is missing for a period):

- Search the user's inbox for that account's broker confirmation emails in the date range.
- Wealthsimple emails are sent to jatan's gmail; janisha's accounts forward from `paul.janisha1994@gmail.com`. Disambiguate which account each confirmation belongs to using the email body (account name, last-4, or the address it was sent to).
- Extract the same fields as above. Wealthsimple has no exec id — use the confirmation number from the email as the id basis (`ws:conf:<number>`).
- If an email is ambiguous (couldn't classify the action, no clear quantity, etc.) — do NOT guess. Surface it to me as a question.

## How to map to ledger executions

For each fetched row:

1. **Compute the `id`** per the rules in [`schemas/ledger.md`](../schemas/ledger.md#idempotency--the-id-field). Use the most-granular broker id available.
2. **Skip if `id` is already in the existing-set.** Count these as "duplicates skipped" for the summary.
3. **Pick the right `action`** from the enum in the schema. The default mapping:
   - IBKR `BOT` on stock → `buy`; `SLD` on stock → `sell`.
   - IBKR `BOT` on option opening → `short_close` if you held a short, else this should be a long-open (currently no enum value — use `other` and explain in notes; raise it to me).
   - IBKR `SLD` on option opening → `short_open`.
   - Expirations → `expire_long` or `expire_short` based on the position side.
   - Assignments → `assign_long` or `assign_short`; pair the option exec and the resulting stock exec with `related_id`.
   - Dividends, interest, fees, transfers → use the corresponding action value.
   - **If unsure** of the right action for a row, use `other`, fill in `notes` describing what the broker returned, and flag it in the summary so I can review.
4. **Find a matching decision file.** For each candidate execution that has a `broker_order_ref`, search `narrative/decisions/*.md` for one whose frontmatter `broker_order_ref` field contains the same id. If found, set `decision_ref` to that file's repo-relative path. If multiple decisions reference the same order, pick the most recently created one and add a note.
5. **Build the YAML execution entry** matching the schema exactly. Use `null` for unknown values; never invent a number you didn't see in the broker data.
6. **Append to the existing `executions:` array.** Maintain sort order: by `date` ascending, then by `imported_at` ascending. Never reorder existing entries.

## Before you commit — show me the diff

For each ledger file you intend to update, show me:

- The account slug
- Count: `N new, M skipped as duplicates`
- A compact table of the N new executions (date, action, symbol, qty, price, net_cash, id)
- Any rows you flagged as ambiguous and want me to confirm before committing

**Wait for my "ok" before calling `commit_file`.** Single-account auto-commit is fine if I said "auto" up front; otherwise pause for review.

## Committing

When I approve:

1. For each updated ledger file, write the full updated file content (frontmatter + body, including the existing entries plus the new ones) via `commit_file`.
2. Update `last_synced_at` to the current ISO timestamp on every file you touched (even if no new rows were appended — this is how we move the cursor).
3. Update `sources_used` to the union of its previous value and the sources you actually used this run.
4. Use a single commit message per file: `ledger: sync <account> +<N> executions (<source> <YYYY-MM-DD>..<YYYY-MM-DD>)`.

## Final summary to me

After all commits, report:

- Per account: file path, +N executions, M duplicates skipped, K flagged for review.
- Totals across the run.
- Any decision files where you set `decision_ref` automatically — list them so I can verify the back-link.
- Anything you punted on (rows you couldn't classify, accounts the connector returned an error for, gaps in date coverage).

## Hard rules (recap)

- Never edit or delete existing `executions` entries. Reverse with an `other` entry if needed.
- Never invent values you didn't see in broker data. Use `null` or ask me.
- Never write account numbers, login info, or any broker credential into the ledger.
- Never use account slugs not in `_shared/accounts.md`. If a real account doesn't have a slug yet, stop and ask me to add one.

---

## Template — initial ledger file

Use this when an account's ledger file doesn't yet exist. Replace placeholders and start the `executions:` array empty before appending the first batch.

```markdown
---
type: ledger
account: <slug>
person: <slug>
status: active
opened: null
last_synced_at: <iso datetime of this run>
sources_used: []
executions: []
---

# <Account display name> — execution ledger

Append-only log of every fill in this account. Synced from the IBKR connector and Gmail broker confirmations via [`investment-os/prompts/sync-executions.md`](../../prompts/sync-executions.md). The dashboard reads this file to compute realized P&L and historical position size.
```
