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
	LedgerExecution,
	AccountPosition,
	PositionHistory,
	PositionSummary,
	OptionTrade,
	LivePrice,
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
	if (fm.type === "ledger" && Array.isArray(fm.executions)) {
		for (const e of fm.executions) {
			if (e && typeof e === "object" && typeof e.symbol === "string") {
				out.add(e.symbol.toUpperCase());
			}
		}
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

// ---- ledger parsing -----------------------------------------------------

// One execution row, enriched with the parent ledger's account/person.
type FlatExecution = LedgerExecution;

async function loadLedgers(parsed: ParsedFile[]): Promise<FlatExecution[]> {
	const out: FlatExecution[] = [];
	for (const f of parsed) {
		if (f.frontmatter.type !== "ledger") continue;
		const account = String(f.frontmatter.account ?? "");
		const person  = String(f.frontmatter.person  ?? "");
		const execs   = f.frontmatter.executions;
		if (!Array.isArray(execs)) continue;
		for (const e of execs) {
			if (!e || typeof e !== "object") continue;
			const date = toIso(e.date) ?? "";
			if (!date) continue;
			out.push({
				id:         String(e.id ?? ""),
				date,
				action:     String(e.action ?? "other"),
				instrument: String(e.instrument ?? ""),
				symbol:     String(e.symbol ?? "").toUpperCase(),
				quantity:   typeof e.quantity === "number" ? e.quantity : null,
				price:      typeof e.price === "number" ? e.price : null,
				currency:   typeof e.currency === "string" ? e.currency : null,
				fees:       typeof e.fees === "number" ? e.fees : null,
				net_cash:   typeof e.net_cash === "number" ? e.net_cash : null,
				account,
				person,
				option:     e.option && typeof e.option === "object"
					? {
						right:  String(e.option.right ?? ""),
						side:   String(e.option.side ?? ""),
						strike: typeof e.option.strike === "number" ? e.option.strike : 0,
						expiry: toIso(e.option.expiry) ?? "",
					}
					: null,
				source:     String(e.source ?? ""),
				notes:      typeof e.notes === "string" ? e.notes : null,
			});
		}
	}
	return out;
}

function ledgerStatusByAccount(parsed: ParsedFile[]): Map<string, string> {
	const m = new Map<string, string>();
	for (const f of parsed) {
		if (f.frontmatter.type !== "ledger") continue;
		const account = String(f.frontmatter.account ?? "");
		if (account) m.set(account, String(f.frontmatter.status ?? "active"));
	}
	return m;
}

// Stock-side action effects. quantity flows in as positive; sign comes from action.
function applyStock(bucket: AccountPosition, action: string, qty: number, price: number | null, netCash: number | null) {
	const cashOut = netCash !== null ? Math.abs(netCash) : (price !== null ? qty * price : 0);

	const open  = action === "buy" || action === "assign_long" || action === "exercise_long" || action === "other";
	const close = action === "sell" || action === "expire_long";
	const sOpen = action === "short_open";
	const sClose = action === "short_close" || action === "assign_short" || action === "expire_short" || action === "exercise_short";

	if (open) {
		bucket.shares_held += qty;
		bucket.cost_basis  += cashOut;
		return;
	}
	if (close) {
		// Reduce by average cost so cost_basis stays consistent.
		const before = bucket.shares_held;
		const avg    = before > 0 ? bucket.cost_basis / before : 0;
		bucket.shares_held -= qty;
		bucket.cost_basis  = Math.max(0, bucket.cost_basis - avg * qty);
		if (bucket.shares_held <= 0) bucket.cost_basis = 0;
		return;
	}
	if (sOpen) {
		bucket.shares_held -= qty;
		// Track proceeds as negative cost basis so display can show short collateral if wanted.
		bucket.cost_basis  -= cashOut;
		return;
	}
	if (sClose) {
		bucket.shares_held += qty;
		bucket.cost_basis  += cashOut;
		return;
	}
	if (action === "transfer_in") {
		// Shares arrive from another account; cost basis is unknowable from broker export
		// (net_cash here is market-value-at-transfer, not ACB). Track the share count and
		// flag the bucket so the UI can show "cost basis incomplete".
		bucket.shares_held += qty;
		bucket.transferred_in_shares += qty;
		return;
	}
	if (action === "transfer_out") {
		// Shares leave to another account. Reduce share count proportionally and shrink
		// cost basis at the current weighted-average so remaining shares keep their avg.
		const before = bucket.shares_held;
		const avg    = before > 0 ? bucket.cost_basis / before : 0;
		bucket.shares_held -= qty;
		bucket.cost_basis  = Math.max(0, bucket.cost_basis - avg * qty);
		if (bucket.shares_held <= 0) bucket.cost_basis = 0;
		return;
	}
}

// Option-side: track signed contracts and cumulative net cash on the bucket.
function applyOption(bucket: AccountPosition, action: string, qty: number, netCash: number | null) {
	const cash = netCash ?? 0;
	bucket.net_premium += cash;

	if (action === "buy" || action === "exercise_long")          bucket.shares_held += qty;
	else if (action === "sell" || action === "expire_long")      bucket.shares_held -= qty;
	else if (action === "short_open")                            bucket.shares_held -= qty;
	else if (action === "short_close" || action === "assign_short" || action === "expire_short" || action === "exercise_short")
		bucket.shares_held += qty;
	// "other" + option instrument = ambiguous IBKR BookTrade option leg; skip qty change.
}

function buildPosition(
	fills: FlatExecution[],
	statusByAcct: Map<string, string>,
	live: LivePrice | null,
): PositionHistory | null {
	if (fills.length === 0) return null;

	// Skip cash-only rows for bucket computation (FX, dividends, fees on a cash currency)
	// but they're still listed in the fills table.
	const positionFills = fills.filter((e) => e.instrument !== "cash");

	type Key = string;
	const buckets = new Map<Key, AccountPosition>();
	const keyOf = (acct: string, ccy: string, kind: "stock" | "option") => `${acct}|${ccy}|${kind}`;
	const ensure = (acct: string, person: string, ccy: string, kind: "stock" | "option"): AccountPosition => {
		const k = keyOf(acct, ccy, kind);
		let b = buckets.get(k);
		if (!b) {
			b = {
				account: acct,
				person,
				status: statusByAcct.get(acct) ?? "active",
				currency: ccy,
				kind,
				shares_held: 0,
				cost_basis: 0,
				avg_cost: null,
				net_premium: 0,
				fills: 0,
				last_fill: null,
				transferred_in_shares: 0,
				realized: 0,
				closed_lot_count: 0,
				winning_lot_count: 0,
			};
			buckets.set(k, b);
		}
		return b;
	};

	// FIFO inventory per bucket: lots with cost_per_share (null if cost basis unknown, e.g. transfer_in).
	type Lot = { qty: number; cps: number | null };
	const lotsByKey = new Map<Key, Lot[]>();

	// Per-fill running balance per (account, instrument-bucket). Stocks key on (account, symbol);
	// options key includes contract identity so each contract bucket has its own running count.
	const runByKey = new Map<string, number>();
	const runKeyOf = (e: FlatExecution): string => {
		if (e.instrument === "option" && e.option) {
			const { right, side, strike, expiry } = e.option;
			return `${e.account}|opt|${right}|${side}|${strike}|${expiry}`;
		}
		return `${e.account}|stk|${e.symbol}`;
	};

	// Track peak long shares (across all stock buckets, sum at any instant) and total closed share volume.
	let runningLongTotal = 0;
	let peakLongShares = 0;
	let totalCloseQty = 0;

	const sorted = [...positionFills].sort((a, b) => a.date.localeCompare(b.date));
	for (const e of sorted) {
		const ccy = e.currency ?? "?";
		const qty = e.quantity ?? 0;
		if (qty === 0 && e.action !== "other") continue;
		const kind: "stock" | "option" = e.instrument === "option" ? "option" : "stock";
		const b = ensure(e.account, e.person, ccy, kind);
		b.fills += 1;
		b.last_fill = e.date;

		const beforeLong = kind === "stock" && b.shares_held > 0 ? b.shares_held : 0;

		if (kind === "stock") {
			const k = keyOf(e.account, ccy, "stock");
			const lots = lotsByKey.get(k) ?? [];
			const cashOut = e.net_cash !== null ? Math.abs(e.net_cash) : (e.price !== null ? qty * e.price : 0);

			if (e.action === "buy" || e.action === "assign_long" || e.action === "exercise_long" || e.action === "other") {
				lots.push({ qty, cps: qty > 0 ? cashOut / qty : 0 });
			} else if (e.action === "transfer_in") {
				lots.push({ qty, cps: null });
			} else if (e.action === "sell" || e.action === "expire_long" || e.action === "transfer_out") {
				const sellPps = qty > 0 ? cashOut / qty : 0;
				let remaining = qty;
				let lotRealized = 0;
				let lotCostKnownQty = 0;
				while (remaining > 0 && lots.length > 0) {
					const lot = lots[0];
					const take = Math.min(lot.qty, remaining);
					if (e.action === "sell" || e.action === "expire_long") {
						if (lot.cps !== null) {
							lotRealized += (sellPps - lot.cps) * take;
							lotCostKnownQty += take;
						}
					}
					lot.qty -= take;
					remaining -= take;
					if (lot.qty <= 1e-9) lots.shift();
				}
				if (e.action === "sell" || e.action === "expire_long") {
					b.realized += lotRealized;
					if (lotCostKnownQty > 0) {
						b.closed_lot_count += 1;
						if (lotRealized > 0) b.winning_lot_count += 1;
					}
					totalCloseQty += qty;
				}
			} else if (e.action === "short_open") {
				// Track shorts as negative-qty lots with cps = proceeds per share.
				lots.push({ qty: -qty, cps: qty > 0 ? cashOut / qty : 0 });
			} else if (e.action === "short_close" || e.action === "assign_short" || e.action === "expire_short" || e.action === "exercise_short") {
				const coverPps = qty > 0 ? cashOut / qty : 0;
				let remaining = qty;
				let lotRealized = 0;
				let lotCostKnownQty = 0;
				while (remaining > 0 && lots.length > 0) {
					const lot = lots[0];
					if (lot.qty >= 0) { lots.shift(); continue; } // skip stray long lots
					const take = Math.min(-lot.qty, remaining);
					if (lot.cps !== null) {
						lotRealized += (lot.cps - coverPps) * take;
						lotCostKnownQty += take;
					}
					lot.qty += take;
					remaining -= take;
					if (Math.abs(lot.qty) <= 1e-9) lots.shift();
				}
				b.realized += lotRealized;
				if (lotCostKnownQty > 0) {
					b.closed_lot_count += 1;
					if (lotRealized > 0) b.winning_lot_count += 1;
				}
				totalCloseQty += qty;
			}

			lotsByKey.set(k, lots);
			applyStock(b, e.action, qty, e.price, e.net_cash);
		} else {
			applyOption(b, e.action, qty, e.net_cash);
		}

		// Running balance per (account, instrument-bucket) for the fills table.
		const rk = runKeyOf(e);
		let signed = 0;
		if (e.action === "buy" || e.action === "assign_long" || e.action === "exercise_long" || e.action === "other" || e.action === "transfer_in") signed = qty;
		else if (e.action === "sell" || e.action === "expire_long" || e.action === "transfer_out") signed = -qty;
		else if (e.action === "short_open") signed = -qty;
		else if (e.action === "short_close" || e.action === "assign_short" || e.action === "expire_short" || e.action === "exercise_short") signed = qty;
		const next = (runByKey.get(rk) ?? 0) + signed;
		runByKey.set(rk, next);
		e.position_after = next;

		// Peak long tracking (stock only).
		if (kind === "stock") {
			const afterLong = b.shares_held > 0 ? b.shares_held : 0;
			runningLongTotal += afterLong - beforeLong;
			if (runningLongTotal > peakLongShares) peakLongShares = runningLongTotal;
		}
	}

	// Finalize avg_cost for stock buckets with shares > 0.
	// Divide by cost-known shares (excluding transfer_in dust) so transferred-in shares
	// with unknown ACB don't drag the average toward zero.
	for (const b of buckets.values()) {
		if (b.kind === "stock" && b.shares_held > 0) {
			const costKnown = Math.max(0, b.shares_held - b.transferred_in_shares);
			if (costKnown > 0) b.avg_cost = b.cost_basis / costKnown;
		}
	}

	const byAccount = [...buckets.values()].sort((a, b) => {
		if (a.kind !== b.kind) return a.kind === "stock" ? -1 : 1;
		return a.account.localeCompare(b.account) || a.currency.localeCompare(b.currency);
	});

	let longShares = 0;
	let shortShares = 0;
	let openContracts = 0;
	const costByCcy: Record<string, number> = {};
	for (const b of byAccount) {
		if (b.kind === "stock") {
			if (b.shares_held > 0) longShares += b.shares_held;
			else if (b.shares_held < 0) shortShares += -b.shares_held;
			if (b.cost_basis > 0) costByCcy[b.currency] = (costByCcy[b.currency] ?? 0) + b.cost_basis;
		} else {
			openContracts += b.shares_held;   // signed
		}
	}

	const optTrades = buildOptionTrades(fills.filter((e) => e.instrument === "option"));
	const summary = buildSummary(byAccount, optTrades, fills, live, peakLongShares, longShares, totalCloseQty);

	return {
		total_long_shares:  longShares,
		total_short_shares: shortShares,
		cost_basis_by_currency: costByCcy,
		open_option_contracts:  openContracts,
		by_account: byAccount,
		option_trades: optTrades,
		fills: [...fills].sort((a, b) => b.date.localeCompare(a.date)),
		summary,
	};
}

// Build per-currency P&L, return, turnover, win-rate summary using already-walked buckets
// and option trade groups. Unrealized is only computed for stock buckets whose currency
// matches the live price's currency (no FX conversion done here).
function buildSummary(
	buckets: AccountPosition[],
	optTrades: OptionTrade[],
	fills: FlatExecution[],
	live: LivePrice | null,
	peakLongShares: number,
	currentLongShares: number,
	totalCloseQty: number,
): PositionSummary {
	const realizedStock:  Record<string, number> = {};
	const realizedOption: Record<string, number> = {};
	const unrealized:     Record<string, number> = {};
	const totalBuys:      Record<string, number> = {};
	const totalSells:     Record<string, number> = {};
	const unmatchedCcy   = new Set<string>();

	let closedTrades = 0;
	let winningTrades = 0;

	for (const b of buckets) {
		if (b.kind !== "stock") continue;
		realizedStock[b.currency] = (realizedStock[b.currency] ?? 0) + b.realized;
		closedTrades  += b.closed_lot_count;
		winningTrades += b.winning_lot_count;
		// Unrealized: only when bucket ccy matches the live price ccy.
		if (live && live.price !== null && live.currency && b.currency === live.currency && b.shares_held !== 0 && b.avg_cost !== null) {
			const costKnown = Math.max(0, b.shares_held - b.transferred_in_shares);
			const mv = b.shares_held * live.price;
			const cb = costKnown * b.avg_cost;
			unrealized[b.currency] = (unrealized[b.currency] ?? 0) + (mv - cb);
		} else if (b.shares_held !== 0 && live && b.currency !== live.currency) {
			unmatchedCcy.add(b.currency);
		}
	}

	for (const t of optTrades) {
		if (t.status !== "closed") continue;
		realizedOption[t.currency] = (realizedOption[t.currency] ?? 0) + t.realized;
		closedTrades  += 1;
		if (t.realized > 0) winningTrades += 1;
	}

	for (const e of fills) {
		if (e.instrument === "cash") continue;
		const nc = e.net_cash;
		if (nc === null) continue;
		const ccy = e.currency ?? "?";
		if (nc < 0) totalBuys[ccy]  = (totalBuys[ccy]  ?? 0) + (-nc);
		else if (nc > 0) totalSells[ccy] = (totalSells[ccy] ?? 0) + nc;
	}

	const ccys = new Set([
		...Object.keys(realizedStock),
		...Object.keys(realizedOption),
		...Object.keys(unrealized),
		...Object.keys(totalBuys),
		...Object.keys(totalSells),
	]);
	const realized:    Record<string, number> = {};
	const totalReturn: Record<string, number> = {};
	const totalReturnPct: Record<string, number | null> = {};
	for (const c of ccys) {
		realized[c] = (realizedStock[c] ?? 0) + (realizedOption[c] ?? 0);
		totalReturn[c] = realized[c] + (unrealized[c] ?? 0);
		const cost = totalBuys[c];
		totalReturnPct[c] = cost && cost > 0 ? totalReturn[c] / cost : null;
	}

	// Weighted-avg cost per currency across live stock buckets (cost-known shares only).
	const avgCostByCcy:   Record<string, number> = {};
	const curSharesByCcy: Record<string, number> = {};
	const costAccum:      Record<string, number> = {};
	const qtyAccum:       Record<string, number> = {};
	for (const b of buckets) {
		if (b.kind !== "stock" || b.shares_held === 0) continue;
		curSharesByCcy[b.currency] = (curSharesByCcy[b.currency] ?? 0) + b.shares_held;
		const knownQty = Math.max(0, b.shares_held - b.transferred_in_shares);
		if (knownQty > 0 && b.avg_cost !== null) {
			costAccum[b.currency] = (costAccum[b.currency] ?? 0) + b.avg_cost * knownQty;
			qtyAccum[b.currency]  = (qtyAccum[b.currency]  ?? 0) + knownQty;
		}
	}
	for (const c of Object.keys(qtyAccum)) {
		if (qtyAccum[c] > 0) avgCostByCcy[c] = costAccum[c] / qtyAccum[c];
	}

	return {
		realized_stock_by_currency:  realizedStock,
		realized_option_by_currency: realizedOption,
		realized_by_currency:        realized,
		unrealized_by_currency:      unrealized,
		total_return_by_currency:    totalReturn,
		total_return_pct_by_currency: totalReturnPct,
		total_buys_by_currency:      totalBuys,
		total_sells_by_currency:     totalSells,
		closed_trades_count:  closedTrades,
		winning_trades_count: winningTrades,
		win_rate: closedTrades > 0 ? winningTrades / closedTrades : null,
		peak_long_shares:    peakLongShares,
		current_long_shares: currentLongShares,
		turnover_pct: peakLongShares > 0 ? totalCloseQty / peakLongShares : null,
		avg_cost_by_currency:       avgCostByCcy,
		current_shares_by_currency: curSharesByCcy,
		live_price:    live?.price ?? null,
		live_currency: live?.currency ?? null,
		live_unmatched_currencies: [...unmatchedCcy].sort(),
	};
}

// Group option legs by (account, currency, right, side, strike, expiry) and compute
// realized P&L when a group is fully closed. Closing actions for longs:
// sell, expire_long, exercise_long. For shorts: short_close, expire_short,
// assign_short, exercise_short. Realized = sum(net_cash) across all legs in the group:
// long buy is negative cash, long sell is positive cash, sum = realized.
function buildOptionTrades(legs: FlatExecution[]): OptionTrade[] {
	const groups = new Map<string, OptionTrade>();
	const sorted = [...legs].sort((a, b) => a.date.localeCompare(b.date));

	for (const e of sorted) {
		if (!e.option) continue;
		const qty = e.quantity ?? 0;
		if (qty === 0) continue;
		const ccy = e.currency ?? "?";
		const sym = e.symbol;
		const { right, side, strike, expiry } = e.option;
		const key = `${e.account}|${ccy}|${sym}|${right}|${side}|${strike}|${expiry}`;

		let g = groups.get(key);
		if (!g) {
			g = {
				account: e.account, currency: ccy, symbol: sym,
				right, side, strike, expiry,
				contracts_opened: 0, contracts_closed: 0, net_contracts: 0,
				open_premium: 0, close_premium: 0, realized: 0,
				opened_date: e.date, closed_date: null,
				status: "open", close_action: null, legs: [],
			};
			groups.set(key, g);
		}

		g.legs.push(e);
		g.realized += e.net_cash ?? 0;

		const isLong  = side === "long";
		const isShort = side === "short";
		const openLong   = isLong  && e.action === "buy";
		const openShort  = isShort && e.action === "short_open";
		const closeLong  = isLong  && (e.action === "sell" || e.action === "expire_long" || e.action === "exercise_long");
		const closeShort = isShort && (e.action === "short_close" || e.action === "expire_short" || e.action === "assign_short" || e.action === "exercise_short");

		if (openLong || openShort) {
			g.contracts_opened += qty;
			g.open_premium    += e.net_cash ?? 0;
			g.net_contracts   += isLong ? qty : -qty;
		} else if (closeLong || closeShort) {
			g.contracts_closed += qty;
			g.close_premium   += e.net_cash ?? 0;
			g.net_contracts   -= isLong ? qty : -qty;
			g.closed_date      = e.date;
			g.close_action     = e.action;
		}
	}

	for (const g of groups.values()) {
		if (g.net_contracts === 0 && g.contracts_closed > 0) g.status = "closed";
		else if (g.contracts_closed > 0) g.status = "partial";
		else g.status = "open";
	}

	return [...groups.values()].sort((a, b) => {
		const rank = (s: string) => (s === "closed" ? 0 : s === "partial" ? 1 : 2);
		const r = rank(a.status) - rank(b.status);
		if (r !== 0) return r;
		const aKey = a.closed_date ?? a.opened_date;
		const bKey = b.closed_date ?? b.opened_date;
		return bKey.localeCompare(aKey);
	});
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

	const allFills = await loadLedgers(parsed);
	const symbolFills = allFills.filter((e) => e.symbol === symbol);
	const position = buildPosition(symbolFills, ledgerStatusByAccount(parsed), live);

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
		position,
		computed: {
			days_since_last_decision: daysSince(lastDecisionAt),
			days_since_thesis_update: thesis?.age_days ?? null,
			next_catalyst_in_days: daysUntil(nextCatalystAt),
		},
	};
}
