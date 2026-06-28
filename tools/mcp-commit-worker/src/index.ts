import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

type Env = {
  GITHUB_TOKEN: string;
  SHARED_SECRET: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  MCP_OBJECT: DurableObjectNamespace;
};

const ALLOWED_PREFIXES = [
  "investment-os/narrative/",
  "workout-os/narrative/",
  "health-os/narrative/",
  "relationship-os/narrative/",
];

const SECRET_PATTERNS: RegExp[] = [
  /ghp_[A-Za-z0-9]{20,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /sk-[A-Za-z0-9-]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
];

function validatePath(p: string): string | null {
  if (!p || typeof p !== "string") return "path is required";
  if (p.startsWith("/")) return "absolute paths are not allowed";
  if (p.includes("..")) return "'..' is not allowed in paths";
  if (!p.endsWith(".md")) return "path must end with .md";
  if (!ALLOWED_PREFIXES.some((pre) => p.startsWith(pre))) {
    return `path must be under one of: ${ALLOWED_PREFIXES.join(", ")}`;
  }
  return null;
}

function looksSecretish(content: string): string | null {
  for (const re of SECRET_PATTERNS) {
    if (re.test(content)) return re.source;
  }
  return null;
}

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function ghHeaders(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "User-Agent": "life-os-commit-mcp",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export class CommitMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "life-os-commit",
    version: "1.0.0",
  });

  async init() {
    const env = this.env;
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;

    this.server.tool(
      "commit_file",
      {
        path: z
          .string()
          .describe(
            "Repo-relative path. Must be under */narrative/ and end with .md (e.g. investment-os/narrative/decisions/2026-06-27-foo.md)",
          ),
        content: z.string().describe("Full file body including YAML frontmatter"),
        message: z.string().describe("Git commit message"),
        overwrite: z
          .boolean()
          .optional()
          .describe("Set true to update an existing file. Default false."),
      },
      async ({ path, content, message, overwrite }) => {
        const pathErr = validatePath(path);
        if (pathErr) return { content: [{ type: "text", text: `Refused: ${pathErr}` }] };
        const secretHit = looksSecretish(content);
        if (secretHit) {
          return {
            content: [
              {
                type: "text",
                text: `Refused: content matches a secret pattern (${secretHit})`,
              },
            ],
          };
        }

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const getRes = await fetch(url, { headers: ghHeaders(env) });
        let sha: string | undefined;
        if (getRes.status === 200) {
          if (!overwrite) {
            return {
              content: [
                {
                  type: "text",
                  text: `Refused: ${path} already exists. Pass overwrite: true to update.`,
                },
              ],
            };
          }
          const existing = (await getRes.json()) as { sha: string };
          sha = existing.sha;
        } else if (getRes.status !== 404) {
          const t = await getRes.text();
          return {
            content: [
              { type: "text", text: `GitHub GET error ${getRes.status}: ${t}` },
            ],
          };
        }

        const putRes = await fetch(url, {
          method: "PUT",
          headers: { ...ghHeaders(env), "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            content: utf8ToBase64(content),
            ...(sha ? { sha } : {}),
          }),
        });
        if (!putRes.ok) {
          const t = await putRes.text();
          return {
            content: [
              { type: "text", text: `GitHub PUT error ${putRes.status}: ${t}` },
            ],
          };
        }
        const result = (await putRes.json()) as {
          commit: { sha: string; html_url: string };
          content: { path: string };
        };
        return {
          content: [
            {
              type: "text",
              text: `Committed ${result.content.path} as ${result.commit.sha}\n${result.commit.html_url}`,
            },
          ],
        };
      },
    );

    this.server.tool(
      "read_file",
      { path: z.string().describe("Repo-relative path") },
      async ({ path }) => {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          {
            headers: {
              ...ghHeaders(env),
              Accept: "application/vnd.github.raw",
            },
          },
        );
        if (!res.ok) {
          return {
            content: [{ type: "text", text: `Error ${res.status}: cannot read ${path}` }],
          };
        }
        const text = await res.text();
        return { content: [{ type: "text", text }] };
      },
    );

    this.server.tool(
      "list_directory",
      {
        path: z
          .string()
          .describe(
            "Repo-relative directory path. Use empty string for repo root.",
          ),
      },
      async ({ path }) => {
        const res = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
          { headers: ghHeaders(env) },
        );
        if (!res.ok) {
          return {
            content: [{ type: "text", text: `Error ${res.status}: cannot list ${path}` }],
          };
        }
        const items = (await res.json()) as Array<{
          name: string;
          type: string;
          path: string;
        }>;
        const lines = items
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1))
          .map((i) => `${i.type === "dir" ? "[d]" : "[f]"} ${i.path}`);
        return {
          content: [{ type: "text", text: lines.join("\n") || "(empty)" }],
        };
      },
    );
  }
}

function unauthorized(): Response {
  return new Response("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Bearer realm="life-os-commit"' },
  });
}

function isAuthorized(request: Request, env: Env): boolean {
  if (!env.SHARED_SECRET) return false;
  const header = request.headers.get("authorization") ?? "";
  if (header === `Bearer ${env.SHARED_SECRET}`) return true;
  const url = new URL(request.url);
  if (url.searchParams.get("key") === env.SHARED_SECRET) return true;
  return false;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        "life-os-commit MCP server. POST /mcp (Streamable HTTP) or GET /sse (SSE). Auth: Bearer <SHARED_SECRET>.",
        { status: 200 },
      );
    }

    if (!isAuthorized(request, env)) return unauthorized();

    if (url.pathname === "/sse" || url.pathname.startsWith("/sse/")) {
      return CommitMcp.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return CommitMcp.serve("/mcp").fetch(request, env, ctx);
    }
    return new Response("Not found", { status: 404 });
  },
};
