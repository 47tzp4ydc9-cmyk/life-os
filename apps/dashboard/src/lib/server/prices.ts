import YahooFinance from "yahoo-finance2";
import type { LivePrice } from "$lib/types";

const yahooFinance = new (YahooFinance as any)();

// Tiny in-memory cache so repeat clicks during a dev session don't hammer Yahoo.
const cache = new Map<string, { at: number; data: LivePrice }>();
const TTL_MS = 60 * 1000;

export async function getPrice(symbol: string): Promise<LivePrice> {
	const now = Date.now();
	const cached = cache.get(symbol);
	if (cached && now - cached.at < TTL_MS) return cached.data;

	try {
		// yahoo-finance2's quote() return type is a complex overloaded union; loosen for our use.
		const raw = (await yahooFinance.quote(symbol)) as any;
		const q = Array.isArray(raw) ? raw[0] : raw;
		const data: LivePrice = {
			symbol,
			price: q?.regularMarketPrice ?? null,
			day_change_pct: q?.regularMarketChangePercent ?? null,
			currency: q?.currency ?? null,
			market_state: q?.marketState ?? null,
			fetched_at: new Date(now).toISOString(),
		};
		cache.set(symbol, { at: now, data });
		return data;
	} catch (err) {
		return {
			symbol,
			price: null,
			day_change_pct: null,
			currency: null,
			market_state: null,
			fetched_at: new Date(now).toISOString(),
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
