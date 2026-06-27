# Schema: research

One file per topic. Append-only: new sessions add sections to the bottom, never overwrite older ones.

**Path:** `narrative/research/<slug>.md`

## Frontmatter

```yaml
---
type: research
created: 2026-06-27
updated: 2026-06-27
topic_type: company      # company | theme | industry | technology | etf | strategy | event | macro
slug: silicon-photonics
related_symbols: [GLW, COHR, LITE]
related_themes: [photonics, ai-datacenter]
current_verdict: buy     # buy | wait | skip | n/a — reflects the most recent session
related_catalysts: []    # slugs from narrative/catalysts/
---
```

## Body sections

```markdown
## Summary

(rolling summary, rewritten as understanding deepens — the only section you may overwrite)

## Sessions

### 2026-06-27 — initial scan

**Sources:**
- (links)

**Findings:**
- (bullets)

**Five-Filter check:**
- Catalyst: 🟢 / 🟡 / 🔴 — (one-line note)
- Institutional flow: 🟢 / 🟡 / 🔴 — (one-line note)
- Chart / accumulation: 🟢 / 🟡 / 🔴 — (one-line note)
- Sector in favor: 🟢 / 🟡 / 🔴 — (one-line note)
- Narrative fit: 🟢 / 🟡 / 🔴 — (one-line note)

**Verdict:** buy | wait | skip

**Follow-ups:**
- (action items, optionally promoted to action-items.md)
```

## Rules

- Append a new `### YYYY-MM-DD — <session label>` under `## Sessions` for each research session.
- The Five-Filter check is **required** for any session that ends with a buy/wait/skip verdict. Definitions of each filter, green/yellow/red criteria, and verdict thresholds are in [`../strategies/five-filter.md`](../strategies/five-filter.md) — read that file before scoring.
- After each session, update `current_verdict` in the frontmatter to reflect the latest view. Session entries themselves are immutable history.
- Only `## Summary` may be rewritten; session entries are not.
- If the topic splits (e.g., a theme becomes too broad), create new files and cross-link rather than rewriting.
