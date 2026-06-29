# Accounts

Canonical list of accounts and people referenced across modules. Use the exact slug below in any `account:` or `person:` frontmatter field — never spell it differently.

## People

- `jatan` — primary user
- `janisha` — spouse; Wealthsimple emails forwarded from `paul.janisha1994@gmail.com` to jatan's gmail

## Investment accounts

| Slug | Person | Broker | Type | Registered | Currency | Notes |
|------|--------|--------|------|------------|----------|-------|
| `ibkr_margin` | jatan | IBKR | Margin | no | multi | options, US + CAD |
| `ws_margin` | jatan | Wealthsimple | Non-registered Margin | no | multi | |
| `ws_jatan_corp` | jatan | Wealthsimple | Corporate Investing Margin | no | multi | incorporated business account |
| `ws_tfsa` | jatan | Wealthsimple | TFSA | yes | multi | tax-free |
| `ws_rrsp` | jatan | Wealthsimple | RRSP | yes | multi | no withholding on US div |
| `ws_resp` | jatan | Wealthsimple | RESP | yes | multi | child's education — conservative only |
| `ws_janisha_tfsa` | janisha | Wealthsimple | TFSA | yes | multi | |
| `ws_janisha_margin` | janisha | Wealthsimple | Non-registered Margin | no | multi | |

## When adding an account

1. Add a row above with a new unique slug.
2. Update any sync scripts that enumerate accounts.
3. Do not bulk-rewrite history — old narrative files keep their old slug if one was renamed.

## Retired slugs

| Retired slug | Merged into | When | Notes |
|---|---|---|---|
| `ibkr_tfsa_closed` | `ws_tfsa` | 2026-06-28 | IBKR TFSA closed; 18 fills (2026-05-29 – 2026-06-24) appended to `ws_tfsa.md` with `source: ibkr`. Do not reuse this slug. |
| `ws_resp_closed` | `ws_resp` | 2026-06-28 | Legacy WS RESP (WK-prefix); 41 fills transferred 2025-07-25 and appended to `ws_resp.md`. Do not reuse this slug. |
