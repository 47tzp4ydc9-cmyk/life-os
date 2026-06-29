// Client-safe formatting helpers.

export function fmtUsd(v: number | null | undefined, opts: { signed?: boolean } = {}): string {
	if (v === null || v === undefined || Number.isNaN(v)) return "—";
	const sign = opts.signed && v > 0 ? "+" : "";
	return `${sign}$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function fmtPct(v: number | null | undefined): string {
	if (v === null || v === undefined || Number.isNaN(v)) return "—";
	const s = v >= 0 ? "+" : "";
	return `${s}${v.toFixed(2)}%`;
}

export function fmtDate(iso: string | undefined | null): string {
	if (!iso) return "—";
	// Parse YYYY-MM-DD as a local date so we don't shift a day when rendering
	// in a timezone west of UTC. Fall back to Date(iso) for full timestamps.
	const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	const d = ymd
		? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
		: new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function relTime(iso: string | undefined | null): string {
	if (!iso) return "—";
	const t = Date.parse(iso);
	if (Number.isNaN(t)) return iso;
	const days = Math.floor((Date.now() - t) / 86400000);
	if (days === 0) return "today";
	if (days === 1) return "yesterday";
	if (days > 0 && days < 14) return `${days}d ago`;
	if (days >= 14 && days < 60) return `${Math.floor(days / 7)}w ago`;
	if (days >= 60 && days < 365) return `${Math.floor(days / 30)}mo ago`;
	if (days >= 365) return `${Math.floor(days / 365)}y ago`;
	if (days === -1) return "tomorrow";
	if (days < 0 && days > -14) return `in ${-days}d`;
	if (days <= -14 && days > -60) return `in ${Math.floor(-days / 7)}w`;
	return iso;
}

export function dteSeverity(dte: number | null): "red" | "yellow" | "green" | "muted" {
	if (dte === null) return "muted";
	if (dte < 0) return "muted";
	if (dte < 14) return "red";
	if (dte < 30) return "yellow";
	return "green";
}

export function prioritySeverity(p: string | null): "red" | "yellow" | "green" | "muted" {
	if (p === "high") return "red";
	if (p === "medium") return "yellow";
	if (p === "low") return "green";
	return "muted";
}

export function strikeDelta(strike: number | undefined, price: number | null): {
	pct: number | null;
	itm: boolean | null;
} {
	if (strike == null || price == null) return { pct: null, itm: null };
	const pct = ((price - strike) / strike) * 100;
	return { pct, itm: pct < 0 }; // for a short put: strike > price = ITM
}
