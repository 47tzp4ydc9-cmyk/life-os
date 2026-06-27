# Broker operational notes

Static facts about each broker that affect order placement and reconciliation. Update when you learn something new — don't rediscover it.

## Wealthsimple

- Stop orders trigger to **market**, not limit. A gap-down past your stop fills at the gap price.
- Stop orders only fire during regular hours (9:30–16:00 ET). Pre/post-market drops do not trigger.
- GTC orders expire after ~90 days.
- Options coverage is limited; check the app before assuming a strategy is supported.
- Order fills arrive as email notifications — there is no streaming API. Sync depends on Gmail.
- CDRs (Canadian Depositary Receipts) for US stocks are a **distinct instrument** from the underlying US shares: same ticker prefix, different ISIN, fractional, CAD-hedged. Track separately (`instrument: cdr`).

## Interactive Brokers (IBKR)

- Distinguishes **instructions** (staged, awaiting user approval in the app) from **working orders** (live at exchange). AI agents can create/delete instructions; working orders must be cancelled in the IBKR app.
- Stop-limit orders are supported and reliable — prefer over Wealthsimple for stop management.
- Option chain data occasionally errors near market close — retry, or use a web fallback.
- Forex P&L from CAD/USD swings is reported separately; not the same as position P&L.

## Gmail (data source)

- Wealthsimple is the sender for both jatan's and janisha's fills. Distinguish by the account name inside the email body, not the sender.
- Janisha's emails are forwarded — the original `From:` survives in headers; parse from body.
