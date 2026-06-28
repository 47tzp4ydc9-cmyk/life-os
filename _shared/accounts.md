# Accounts

Canonical list of accounts and people referenced across modules. Use the exact slug below in any `account:` or `person:` frontmatter field — never spell it differently.

## People

- `jatan` — primary user
- `janisha` — spouse; Wealthsimple emails forwarded from `paul.janisha1994@gmail.com` to jatan's gmail

## Investment accounts

| Slug | Person | Broker | Type | Registered | Currency | Notes |
|------|--------|--------|------|------------|----------|-------|
| `ibkr_margin` | jatan | IBKR | Margin | no | multi | options, US + CAD |
| `ibkr_tfsa_closed` | jatan | IBKR | TFSA | yes | multi | closed; balance moved to `ws_tfsa`. Historical fills only |
| `ws_margin` | jatan | Wealthsimple | Non-registered Margin | no | multi | |
| `ws_jatan_corp` | jatan | Wealthsimple | Corporate Investing Margin | no | multi | incorporated business account |
| `ws_tfsa` | jatan | Wealthsimple | TFSA | yes | multi | tax-free |
| `ws_rrsp` | jatan | Wealthsimple | RRSP | yes | multi | no withholding on US div |
| `ws_resp` | jatan | Wealthsimple | RESP | yes | multi | child's education — conservative only |
| `ws_resp_closed` | jatan | Wealthsimple | RESP | yes | multi | legacy WS RESP (WK-prefix); balance transferred to `ws_resp` on 2025-07-25 |
| `ws_janisha_tfsa` | janisha | Wealthsimple | TFSA | yes | multi | |
| `ws_janisha_margin` | janisha | Wealthsimple | Non-registered Margin | no | multi | |

## When adding an account

1. Add a row above with a new unique slug.
2. Update any sync scripts that enumerate accounts.
3. Do not bulk-rewrite history — old narrative files keep their old slug if one was renamed.
