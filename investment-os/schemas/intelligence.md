# Schema: intelligence

AI-generated observations about *your behavior and patterns*, not about the market. Generated on demand or on a monthly cadence — never continuously.

**Path:** `narrative/intelligence/YYYY-MM-<slug>.md`

## Frontmatter

```yaml
---
type: intelligence
created: 2026-06-27
updated: 2026-06-27
observation: "I hold losers ~40% longer than winners before closing."
confidence: medium       # low | medium | high
evidence_query: "SELECT ... FROM executions WHERE ..."  # the actual query that produced this
evidence_n: 23           # number of data points the claim is based on
related_themes: []
related_strategies: [swing]
recheck_after: 2026-12-27   # when to re-run the query and validate
status: active           # active | invalidated | superseded
---
```

## Body sections

```markdown
## Observation

(one paragraph, plain English)

## Evidence

(table or bullets — the actual data points that support the claim)

## What to do about it

(concrete behavior change, or "monitor only")

## Recheck log

- 2026-06-27: initial
```

## Rules

- Every observation MUST have `evidence_query` and `evidence_n`. No exceptions. Claims without evidence are noise.
- If `evidence_n` < 10, set `confidence: low` regardless of how compelling the pattern looks.
- On recheck, append to `## Recheck log` and update `status` if invalidated.
- An invalidated observation stays in the repo — it's a lesson.
