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

**Follow-ups:**
- (action items, optionally promoted to action-items.md)
```

## Rules

- Append a new `### YYYY-MM-DD — <session label>` under `## Sessions` for each research session.
- Only `## Summary` may be rewritten; session entries are immutable history.
- If the topic splits (e.g., a theme becomes too broad), create new files and cross-link rather than rewriting.
