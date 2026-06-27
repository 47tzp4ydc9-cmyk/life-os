# Repo conventions

## Folder shape (per module)

```
<module>/
├── narrative/    # markdown, human + AI authored
├── data/         # SQLite + CSV, script authored
├── scripts/      # Python sync / import code
└── schemas/      # YAML frontmatter spec, one file per doc type
```

## Markdown

- One H1 per file, derived from frontmatter `title` (or the symbol/slug if no title).
- Use `##` for sections. Avoid deeper than `###`.
- Lists use `-`, not `*`.
- Code fences specify language.

## Frontmatter

```yaml
---
type: decision        # required, matches a schema filename
created: 2026-06-27   # required, ISO date
updated: 2026-06-27   # required, updated on every edit
tags: [photonics, swing]
---
```

Module-specific schemas extend this base.

## Git

- One logical change per commit.
- Commit messages: `<module>: <imperative summary>` (e.g. `investment-os: add GLW thesis`).
- Nightly sync commits: `investment-os: nightly sync YYYY-MM-DD`.

## Secrets

Never committed. Live in `~/.config/life-os/.env` or macOS Keychain. The repo's `.env.example` files document required variables only.
