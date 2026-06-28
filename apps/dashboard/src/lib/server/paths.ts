import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { env } from "$env/dynamic/private";

const here = dirname(fileURLToPath(import.meta.url));

// Resolve the life-os repo root. Defaults to two levels above the dashboard
// (apps/dashboard/ → repo root). Override via LIFE_OS_ROOT env var.
export const REPO_ROOT = env.LIFE_OS_ROOT
	? resolve(env.LIFE_OS_ROOT)
	: resolve(here, "..", "..", "..", "..", "..");

export const NARRATIVE_ROOT = resolve(REPO_ROOT, "investment-os", "narrative");
