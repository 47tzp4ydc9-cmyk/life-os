import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import fg from "fast-glob";
import matter from "gray-matter";
import { marked } from "marked";
import { NARRATIVE_ROOT, REPO_ROOT } from "./paths";
import type {
	TickerPage,
	TickerSummary,
	ActionItem,
	ThesisData,
	DecisionData,
	OptionData,
	CatalystData,
} from "$lib/types";
import { getPrice } from "./prices";

type ParsedFile = {
	path: string;          // repo-relative
	frontmatter: Record<string, any>;
	body: string;
};

// Body markdown is from the user's own repo — trusted, not user-input from the web.
marked.setOptions({ gfm: true, breaks: false });

// ---- date helpers --------------------------------------------------------

// gray-matter parses YAML dates into JS Date objects. Normalize everything
// to ISO YYYY-MM-DD strings so the client sees consistent values.
function toIso(v: unknown): string | undefined {
	if (v == null) return undefined;
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === "string") {
		const t = Date.parse(v);
		if (!Number.isNaN(t)) return new Date(t).toISOString().slice(0, 10);
	}
	return undefined;
}

function daysSince(iso: string | undefined | null): number | null {
	if (!iso) return null;
	const t = Date.parse(iso);
	if (Number.isNaN(t)) return null;
	return Math.floor((Date.now() - t) / 86400000);
}

function daysUntil(iso: string | undefined | null): number | null {
	const d = daysSince(iso);
	return d === null ? null : -d;
}

// ---- markdown helpers ----------------------------------------------------

// Extract the body of a named H2 section as HTML (without the heading).
function extractSection(body: string, headingRegex: RegExp): string {
	const lines = body.split("\n");
	let start = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^##\s+/.test(lines[i]) && headingRegex.test(lines[i])) {
			start = i + 1;
			break;
		}
	}
	if (start === -1) return "";
	let end = lines.length;
	for (let i = start; i < lines.length; i++) {
		if (/^##\s+/.test(lines[i])) { end = i; break; }
	}
	const section = lines.slice(start, end).join("\n").trim();
	return marked.parse(section) as string;
}

// First paragraph of the body, ignoring any leading H1/H2.
function extractLede(body: string): string {
	const lines = body.split("\n").filter((l) => !/^#\s+/.test(l));
	const para: string[] = [];
	let started = false;
	for (const l of lines) {
		const trimmed = l.trim();
		if (!started && trimmed === "") continue;
		if (started && trimmed === "") break;
		if (/^#{2,6}\s+/.test(trimmed)) {
			if (started) break;
			continue;
		}
		para.push(l);
		started = true;
	}
	const joined = para.join("\n").trim();
	if (!joined) return "";
	return marked.parse(joined) as string;
}

function extractTitle(body: string): string {
	const m = body.match(/^#\s+(.+)$/m);
	return m ? m[1].trim() : "";
}

// ---- file walking --------------------------------------------------------

async function listNarrativeFiles(): Promise<string[]> {
	return fg("**/*.md", {
		cwd: NARRATIVE_ROOT,
		dot: false,
		absolute: true,
		ignore: ["**/.*/**"],
	});
}

async function parseFile(absPath: string): Promise<ParsedFile> {
	const raw = await readFile(absPath, "utf8");
	const parsed = matter(raw);
	return {
		path: relative(REPO_ROOT, absPath),
		frontmatter: parsed.data ?? {},
		body: parsed.content,
	};
}

function symbolsIn(file: ParsedFile): string[] {
	const fm = file.frontmatter;
	const out = new Set<string>();
	if (typeof fm.symbol === "string") out.add(fm.symbol.toUpperCase());
	if (typeof fm.underlying === "string") out.add(fm.underlying.toUpperCase());
	if (Array.isArray(fm.affects)) {
		for (const s of fm.affects) if (typeof s === "string") out.add(s.toUpperCase());
	}
	return [...out];
}

// ---- action-items.md parser ---------------------------------------------

const TAG_RE = /`([a-z_]+):([^`]+)`/g;

function parseActionItemLine(line: string): { item: ActionItem; isOpen: boolean; related: string[] } | null {
	const m = line.match(/^- \[( |x)\] (.*)$/);
	if (!m) return null;
	const isOpen = m[1] === " ";
	const rest = m[2];
	const tags: Record<string, string> = {};
	let tagMatch;
	while ((tagMatch = TAG_RE.exec(rest)) !== null) {
		tags[tagMatch[1]] = tagMatch[2];
	}
	const text = rest.replace(TAG_RE, "").trim();
	const related = (tags.related ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
	return {
		isOpen,
		related,
		item: {
			text,
			priority: tags.priority ?? null,
			due: tags.due ?? null,
			account: tags.account ?? null,
			completed: tags.completed,
		},
	};
}

async function loadActionItems(): Promise<{ open: Map<string, ActionItem[]>; all: { item: ActionItem; isOpen: boolean; related: string[] }[] }> {
	const path = join(NARRATIVE_ROOT, "action-items.md");
	let raw: string;
	try {
		raw = await readFile(path, "utf8");
	} catch {
		return { open: new Map(), all: [] };
	}
	const open = new Map<string, ActionItem[]>();
	const all: { item: ActionItem; isOpen: boolean; related: string[] }[] = [];
	for (const line of raw.split("\n")) {
		const parsed = parseActionItemLine(line);
		if (!parsed) continue;
		all.push(parsed);
		if (parsed.isOpen) {
			for (const sym of parsed.related) {
				const bucket = open.get(sym) ?? [];
				bucket.push(parsed.item);
				open.set(sym, bucket);
			}
		}
	}
	return { open, all };
}

// ---- watchlist.md parser -------------------------------------------------

async function loadWatchlist(): Promise<Map<string, Record<string, string>>> {
	const path = join(NARRATIVE_ROOT, "watchlist.md");
	const out = new Map<string, Record<string, string>>();
	let raw: string;
	try {
		raw = await readFile(path, "utf8");
	} catch {
		return out;
	}
	const lines = raw.split("\n");
	let headers: string[] | null = null;
	let inOpen = false;
	for (const line of lines) {
		if (/^##\s+Open/i.test(line)) { inOpen = true; headers = null; continue; }
		if (/^##\s+/.test(line)) { inOpen = false; headers = null; continue; }
		if (!inOpen) continue;
		if (!line.startsWith("|")) continue;
		const cells = line.split("|").slice(1, -1).map((c) => c.trim());
		if (cells.length === 0) continue;
		if (cells.every((c) => /^[-:]+$/.test(c))) continue;
		if (!headers) { headers = cells.map((h) => h.toLowerCase()); continue; }
		const row: Record<string, string> = {};
		for (let i = 0; i < headers.length; i++) row[headers[i]] = cells[i] ?? "";
		const sym = (row.symbol || "").toUpperCase();
		if (sym) out.set(sym, row);
	}
	return out;
}

// ---- public API ----------------------------------------------------------

export async function listTickers(): Promise<TickerSummary[]> {
	const [files, actionItems, watchlist] = await Promise.all([
		listNarrativeFiles(),
		loadActionItems(),
		loadWatchlist(),
	]);
	const parsed = await Promise.all(files.map(parseFile));

	const tickers = new Map<string, TickerSummary>();
	const ensure = (sym: string) => {
		let t = tickers.get(sym);
		if (!t) {
			t = {
				symbol: sym,
				has_thesis: false,
				has_open_option: false,
				open_action_items: 0,
				upcoming_catalysts: 0,
				on_watchlist: false,
			};
			tickers.set(sym, t);
		}
		return t;
	};

	for (const f of parsed) {
		const type = f.frontmatter.type;
		for (const sym of symbolsIn(f)) {
			const t = ensure(sym);
			if (type === "thesis" && f.frontmatter.status !== "closed") t.has_thesis = true;
			if (type === "option-position" && f.frontmatter.status === "open") t.has_open_option = true;
			if (type === "catalyst" && f.frontmatter.status === "pending") {
				const until = daysUntil(toIso(f.frontmatter.event_date));
				if (until !== null && until >= 0) t.upcoming_catalysts += 1;
			}
		}
	}
	for (const [sym, items] of actionItems.open) ensure(sym).open_action_items = items.length;
	for (const [sym] of watchlist) ensure(sym).on_watchlist = true;

	return [...tickers.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function getTickerPage(symbolIn: string): Promise<TickerPage> {
	const symbol = symbolIn.toUpperCase();
	const [files, actionItems, watchlist, live] = await Promise.all([
		listNarrativeFiles(),
		loadActionItems(),
		loadWatchlist(),
		getPrice(symbol),
	]);
	const parsed = await Promise.all(files.map(parseFile));
	const relevant = parsed.filter((f) => symbolsIn(f).includes(symbol));

	let thesis: ThesisData | null = null;
	const decisions: DecisionData[] = [];
	const options: OptionData[] = [];
	const catalystsUpcoming: CatalystData[] = [];
	const catalystsPast: CatalystData[] = [];

	for (const f of relevant) {
		const type = f.frontmatter.type;
		const created = toIso(f.frontmatter.created);
		const updated = toIso(f.frontmatter.updated);
		const ref = {
			path: f.path,
			type,
			created,
			updated,
			status: f.frontmatter.status,
		};
		const body_html = marked.parse(f.body) as string;

		if (type === "thesis") {
			thesis = {
				...ref,
				frontmatter: { ...f.frontmatter, created, updated },
				summary_html: extractSection(f.body, /summary/i),
				body_html,
				age_days: daysSince(updated ?? created),
				conviction: typeof f.frontmatter.conviction === "number" ? f.frontmatter.conviction : null,
				horizon: typeof f.frontmatter.horizon === "string" ? f.frontmatter.horizon : null,
				key_metrics: Array.isArray(f.frontmatter.key_metrics) ? f.frontmatter.key_metrics : [],
				disconfirming: Array.isArray(f.frontmatter.disconfirming) ? f.frontmatter.disconfirming : [],
			};
		} else if (type === "decision") {
			decisions.push({
				...ref,
				action: f.frontmatter.action ?? "?",
				quantity: f.frontmatter.quantity,
				confidence: f.frontmatter.confidence,
				title: extractTitle(f.body),
				lede_html: extractLede(f.body),
				body_html,
			});
		} else if (type === "option-position") {
			const expiry = toIso(f.frontmatter.current_expiry) ?? "";
			const rollSection = extractSection(f.body, /rolls/i);
			const rollRows = (rollSection.match(/<tr>/g) ?? []).length;
			const rolls = Math.max(0, rollRows - 1);
			options.push({
				...ref,
				side: f.frontmatter.side ?? "?",
				right: f.frontmatter.right ?? "?",
				current_strike: f.frontmatter.current_strike,
				current_expiry: expiry,
				original_strike: typeof f.frontmatter.original_strike === "number" ? f.frontmatter.original_strike : null,
				original_expiry: toIso(f.frontmatter.original_expiry) ?? null,
				dte: daysUntil(expiry),
				net_premium: f.frontmatter.net_premium ?? 0,
				contracts: f.frontmatter.contracts ?? 0,
				rolls,
				lede_html: extractSection(f.body, /why opened/i) || extractLede(f.body),
				body_html,
			});
		} else if (type === "catalyst") {
			const eventDate = toIso(f.frontmatter.event_date) ?? "";
			const c: CatalystData = {
				...ref,
				event_date: eventDate,
				category: f.frontmatter.category ?? "?",
				direction: f.frontmatter.direction ?? "?",
				confidence: f.frontmatter.confidence ?? "?",
				days_until: daysUntil(eventDate),
				body_html,
			};
			if (c.days_until !== null && c.days_until >= 0) catalystsUpcoming.push(c);
			else catalystsPast.push(c);
		}
	}

	decisions.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
	catalystsUpcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
	catalystsPast.sort((a, b) => b.event_date.localeCompare(a.event_date));

	const lastDecisionAt = decisions[0]?.created ?? null;
	const nextCatalystAt = catalystsUpcoming[0]?.event_date ?? null;

	return {
		symbol,
		as_of: new Date().toISOString(),
		live,
		thesis,
		decisions,
		options,
		catalysts: { upcoming: catalystsUpcoming, past: catalystsPast },
		action_items: actionItems.open.get(symbol) ?? [],
		watchlist_entry: watchlist.get(symbol) ?? null,
		computed: {
			days_since_last_decision: daysSince(lastDecisionAt),
			days_since_thesis_update: thesis?.age_days ?? null,
			next_catalyst_in_days: daysUntil(nextCatalystAt),
		},
	};
}
