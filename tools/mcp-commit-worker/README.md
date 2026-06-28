# life-os commit MCP worker

A Cloudflare Worker that exposes a Remote MCP server to claude.ai (and any other MCP client) for writing files to `47tzp4ydc9-cmyk/life-os`.

## What it gives Claude

| Tool | What it does |
|------|--------------|
| `commit_file(path, content, message, overwrite?)` | Create or update a markdown file under `*/narrative/` |
| `read_file(path)` | Read any file from the repo |
| `list_directory(path)` | List the contents of a directory |

## Guardrails (enforced in the Worker)

- Path must be under `investment-os/narrative/`, `workout-os/narrative/`, `health-os/narrative/`, or `relationship-os/narrative/`
- Path must end with `.md`
- No `..`, no absolute paths
- Existing files are protected unless `overwrite: true`
- Refuses content matching obvious secret patterns (`ghp_`, `github_pat_`, `sk-`, `AKIA…`, PEM private key headers)
- Whole endpoint is Bearer-authenticated — only callers holding `SHARED_SECRET` can use it

## One-time deploy

From this directory (`tools/mcp-commit-worker/`):

```bash
npm install
npx wrangler login                              # opens browser, authorize CF
openssl rand -hex 32 | tee /tmp/lifeos-secret   # generate shared secret (save it!)
npx wrangler secret put SHARED_SECRET           # paste the secret above
npx wrangler secret put GITHUB_TOKEN            # paste your repo PAT
npx wrangler deploy
```

After deploy, Wrangler prints the URL — looks like:
`https://life-os-commit.<your-cf-subdomain>.workers.dev`

## Add to claude.ai

claude.ai → **Settings → Connectors → Add custom connector**:

- **Name:** `life-os`
- **Remote MCP server URL:** `https://life-os-commit.<your-cf-subdomain>.workers.dev/mcp`
- **Authentication:** Bearer token → paste the `SHARED_SECRET`

Or, if the UI doesn't show a header field, append `?key=<SHARED_SECRET>` to the URL.

## Local dev

```bash
echo "SHARED_SECRET=devsecret123" > .dev.vars
echo "GITHUB_TOKEN=ghp_yourPAT"  >> .dev.vars
npm run dev
```

Test:

```bash
curl -H "Authorization: Bearer devsecret123" http://localhost:8787/health
```

## Rotating secrets

```bash
npx wrangler secret put SHARED_SECRET   # new value, takes effect immediately
```

Then update the claude.ai connector with the new secret.

## Updating the Worker

Edit `src/index.ts`, then:

```bash
npx wrangler deploy
```

Live within seconds, no restart needed in claude.ai.
