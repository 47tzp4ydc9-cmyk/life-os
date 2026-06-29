<script lang="ts">
	import type { PositionHistory, LedgerExecution, OptionTrade } from "$lib/types";
	import { fmtUsd, fmtDate } from "$lib/format";

	type Props = { position: PositionHistory };
	let { position }: Props = $props();

	const stockBuckets = $derived(position.by_account.filter((b) => b.kind === "stock"));
	const optionBuckets = $derived(position.by_account.filter((b) => b.kind === "option"));

	const stockBucketsLive = $derived(stockBuckets.filter((b) => b.shares_held !== 0));
	const stockBucketsClosed = $derived(stockBuckets.filter((b) => b.shares_held === 0));
	const optionBucketsLive = $derived(optionBuckets.filter((b) => b.shares_held !== 0));

	const closedOptionTrades = $derived(position.option_trades.filter((t) => t.status === "closed"));
	const openOptionTrades   = $derived(position.option_trades.filter((t) => t.status !== "closed"));

	// Format a number with a sign, no currency symbol.
	function fmtQty(n: number): string {
		const s = n >= 0 ? "+" : "−";
		return `${s}${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
	}

	function fmtCcy(n: number | null, ccy: string | null, opts: { signed?: boolean } = {}): string {
		if (n === null || Number.isNaN(n)) return "—";
		const sign = opts.signed && n > 0 ? "+" : "";
		const abs  = Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
		const body = opts.signed && n < 0 ? `−${abs}` : `${sign}${abs}`;
		return ccy ? `${body} ${ccy}` : `$${body}`;
	}

	function actionTone(a: string): "" | "green" | "red" | "yellow" {
		if (a === "buy" || a === "short_close" || a === "exercise_long" || a === "assign_long") return "green";
		if (a === "sell" || a === "short_open" || a === "exercise_short" || a === "assign_short") return "red";
		if (a === "expire_long" || a === "expire_short" || a === "other") return "yellow";
		if (a === "transfer_in" || a === "transfer_out") return "yellow";
		return "";
	}

	// Human verb describing what actually happened on a fill.
	function verbOf(e: LedgerExecution): string {
		const isOpt = e.instrument === "option";
		switch (e.action) {
			case "buy":           return isOpt ? "Bought to open" : "Bought";
			case "sell":          return isOpt ? "Sold to close"  : "Sold";
			case "short_open":    return isOpt ? "Sold to open"   : "Short sold";
			case "short_close":   return isOpt ? "Bought to close" : "Bought to cover";
			case "expire_long":   return "Expired (long)";
			case "expire_short":  return "Expired (short)";
			case "assign_long":   return "Assigned (received)";
			case "assign_short":  return "Assigned (delivered)";
			case "exercise_long": return "Exercised";
			case "exercise_short":return "Exercised against";
			case "transfer_in":   return "Transferred in";
			case "transfer_out":  return "Transferred out";
			case "dividend":      return "Dividend";
			case "interest":      return "Interest";
			case "fee":           return "Fee";
			case "other":         return "Other";
			default:              return e.action;
		}
	}

	// Premium per contract from a trade leg total.
	function perContract(total: number, contracts: number): number {
		return contracts > 0 ? Math.abs(total) / contracts / 100 : 0;
	}

	function tradeHeadline(t: OptionTrade): string {
		const rightLetter = (t.right || "").toUpperCase().charAt(0);
		return `${t.symbol} ${t.strike}${rightLetter} ${t.side} (exp ${fmtDate(t.expiry)})`;
	}

	// Visible cap for the fills table; expand via <details>.
	const FILLS_CAP = 25;
	const recentFills  = $derived(position.fills.slice(0, FILLS_CAP));
	const olderFills   = $derived(position.fills.slice(FILLS_CAP));

	const sum = $derived(position.summary);
	// Currencies shown in the performance header — union of buys/realized/unrealized.
	const perfCurrencies = $derived(
		[...new Set([
			...Object.keys(sum.total_buys_by_currency),
			...Object.keys(sum.realized_by_currency),
			...Object.keys(sum.unrealized_by_currency),
		])].sort()
	);

	function pctFmt(n: number | null): string {
		if (n === null || Number.isNaN(n)) return "—";
		const sign = n > 0 ? "+" : (n < 0 ? "−" : "");
		return `${sign}${(Math.abs(n) * 100).toFixed(1)}%`;
	}

	function unrealizedReason(ccy: string, cs: number | undefined): string {
		if (sum.live_price === null) return "no live price";
		if (sum.live_currency && sum.live_currency !== ccy) {
			return `live price in ${sum.live_currency}; cost basis in ${ccy}`;
		}
		if (!cs) return "position closed in this currency";
		return "—";
	}

	// Best closed option trade by realized P&L.
	const bestOptionTrade = $derived(
		closedOptionTrades.length === 0
			? null
			: closedOptionTrades.reduce((best, t) => (t.realized > (best?.realized ?? -Infinity) ? t : best), null as OptionTrade | null)
	);

	// Hold period: span from earliest fill to today (open) or last fill (closed).
	const fullyClosed = $derived(
		position.total_long_shares === 0 &&
		position.total_short_shares === 0 &&
		position.open_option_contracts === 0
	);
	const holdPeriodDays = $derived.by(() => {
		if (position.fills.length === 0) return null;
		const dates = position.fills.map((f) => f.date).sort();
		const first = new Date(dates[0]);
		const last  = fullyClosed ? new Date(dates[dates.length - 1]) : new Date();
		const ms = last.getTime() - first.getTime();
		return Math.max(0, Math.round(ms / 86400000));
	});

	// % from current avg cost to current price (single-currency case).
	const priceVsCost = $derived.by(() => {
		if (sum.live_price === null || sum.live_currency === null) return null;
		const ac = sum.avg_cost_by_currency[sum.live_currency];
		if (!ac || ac === 0) return null;
		return (sum.live_price - ac) / ac;
	});
</script>

<div class="section-head"><h2>position history</h2></div>

<!-- ============ PERFORMANCE HEADER ============ -->
<div class="ph-perf">
	{#each perfCurrencies as ccy}
		{@const tr  = sum.total_return_by_currency[ccy] ?? 0}
		{@const trp = sum.total_return_pct_by_currency[ccy]}
		{@const urDef = sum.unrealized_by_currency[ccy] !== undefined}
		{@const ur  = sum.unrealized_by_currency[ccy] ?? 0}
		{@const rl  = sum.realized_by_currency[ccy] ?? 0}
		{@const rs  = sum.realized_stock_by_currency[ccy] ?? 0}
		{@const ro  = sum.realized_option_by_currency[ccy] ?? 0}
		{@const ac  = sum.avg_cost_by_currency[ccy]}
		{@const cs  = sum.current_shares_by_currency[ccy]}
		<div class="ph-perf-card">
			<div class="ph-perf-head">
				<span class="ph-perf-ccy mono">{ccy}</span>
				{#if cs}<span class="muted mono" style="font-size: 11px;">{cs.toLocaleString()} sh</span>{/if}
			</div>

			<!-- HERO: total return dominates visually -->
			<div class="ph-hero">
				<div class="ph-hero-label">total return</div>
				<div class="ph-hero-value {tr > 0 ? 'pos' : (tr < 0 ? 'neg' : '')}">
					{fmtCcy(tr, ccy, { signed: true })}
				</div>
				{#if trp !== null && trp !== undefined}
					<div class="ph-hero-pct {trp > 0 ? 'pos' : (trp < 0 ? 'neg' : '')}">{pctFmt(trp)}</div>
				{/if}
			</div>

			<div class="ph-perf-grid">
				<div class="ph-stat">
					<div class="ph-label">unrealized</div>
					<div class="ph-value {urDef && ur > 0 ? 'pos' : (urDef && ur < 0 ? 'neg' : '')}">
						{#if urDef}
							{fmtCcy(ur, ccy, { signed: true })}
						{:else}
							<span class="muted" style="font-size: 12px; font-weight: 400;">{unrealizedReason(ccy, cs)}</span>
						{/if}
					</div>
				</div>
				<div class="ph-stat">
					<div class="ph-label">realized</div>
					<div class="ph-value {rl > 0 ? 'pos' : (rl < 0 ? 'neg' : '')}">
						{fmtCcy(rl, ccy, { signed: true })}
					</div>
					{#if rs !== 0 || ro !== 0}
						<div class="muted" style="font-size: 11px;">
							stock {fmtCcy(rs, ccy, { signed: true })} · opt {fmtCcy(ro, ccy, { signed: true })}
						</div>
					{/if}
				</div>
				<div class="ph-stat">
					<div class="ph-label">avg cost</div>
					<div class="ph-value">
						{#if ac !== undefined && ac !== null}{fmtCcy(ac, ccy)}{:else}<span class="muted" style="font-size: 13px;">—</span>{/if}
					</div>
				</div>
				{#if sum.live_price !== null && sum.live_currency === ccy}
					<div class="ph-stat">
						<div class="ph-label">current price</div>
						<div class="ph-value">{fmtCcy(sum.live_price, ccy)}</div>
					</div>
				{/if}
			</div>
		</div>
	{/each}
	{#if perfCurrencies.length === 0}
		<div class="muted">no executions for this symbol yet.</div>
	{/if}
</div>

<!-- ============ INSIGHTS LINE ============ -->
{#if priceVsCost !== null || bestOptionTrade || holdPeriodDays !== null}
	<div class="ph-insights">
		{#if priceVsCost !== null}
			<span class="ph-insight">
				<span class="muted">price vs avg cost:</span>
				<span class="mono {priceVsCost > 0 ? 'pos' : (priceVsCost < 0 ? 'neg' : '')}">{pctFmt(priceVsCost)}</span>
			</span>
		{/if}
		{#if bestOptionTrade}
			<span class="ph-insight">
				<span class="muted">best option trade:</span>
				<span class="mono pos">{fmtCcy(bestOptionTrade.realized, bestOptionTrade.currency, { signed: true })}</span>
				<span class="muted mono" style="font-size: 11px;">({bestOptionTrade.symbol} {bestOptionTrade.strike}{(bestOptionTrade.right ?? '').toUpperCase().charAt(0)})</span>
			</span>
		{/if}
		{#if holdPeriodDays !== null}
			<span class="ph-insight">
				<span class="muted">{fullyClosed ? "trade span:" : "held since first fill:"}</span>
				<span class="mono">{holdPeriodDays}d</span>
			</span>
		{/if}
	</div>
{/if}

<!-- ============ POSITION EVOLUTION ============ -->
<div class="ph-summary">
	<div class="ph-stat">
		<div class="ph-label">long shares (current)</div>
		<div class="ph-value">{position.total_long_shares.toLocaleString()}</div>
	</div>
	{#if position.total_short_shares > 0}
		<div class="ph-stat">
			<div class="ph-label">short shares</div>
			<div class="ph-value neg">{position.total_short_shares.toLocaleString()}</div>
		</div>
	{/if}
	{#if sum.peak_long_shares > 0}
		<div class="ph-stat">
			<div class="ph-label">peak long</div>
			<div class="ph-value">{sum.peak_long_shares.toLocaleString()}</div>
		</div>
	{/if}
	{#if sum.turnover_pct !== null}
		<div class="ph-stat">
			<div class="ph-label">turnover</div>
			<div class="ph-value">{(sum.turnover_pct * 100).toFixed(0)}%</div>
		</div>
	{/if}
	{#if position.open_option_contracts !== 0}
		<div class="ph-stat">
			<div class="ph-label">open option contracts</div>
			<div class="ph-value {position.open_option_contracts < 0 ? 'neg' : 'pos'}">
				{fmtQty(position.open_option_contracts)}
			</div>
		</div>
	{/if}
	<div class="ph-stat">
		<div class="ph-label">total fills</div>
		<div class="ph-value">{position.fills.length}</div>
	</div>
</div>

<!-- ============ PER-ACCOUNT BREAKDOWN ============ -->
{#if stockBucketsLive.length > 0}
	<h3 class="ph-h3">by account · stock</h3>
	<table>
		<thead>
			<tr>
				<th>account</th>
				<th>person</th>
				<th style="width: 70px;">ccy</th>
				<th style="text-align: right;">shares</th>
				<th style="text-align: right;">avg cost</th>
				<th style="text-align: right;">cost basis</th>
				<th style="width: 100px;">last fill</th>
				<th style="width: 60px; text-align: right;">fills</th>
			</tr>
		</thead>
		<tbody>
			{#each stockBucketsLive as b}
				<tr>
					<td class="mono">{b.account}</td>
					<td class="muted">{b.person}</td>
					<td class="mono muted">{b.currency}</td>
					<td class="mono" style="text-align: right;" class:neg={b.shares_held < 0} class:pos={b.shares_held > 0}>
						{fmtQty(b.shares_held)}
						{#if b.transferred_in_shares > 0}
							<div class="muted" style="font-size: 10px;">({b.transferred_in_shares} transferred in)</div>
						{/if}
					</td>
					<td class="mono" style="text-align: right;">
						{fmtCcy(b.avg_cost, b.currency)}
						{#if b.transferred_in_shares > 0 && b.avg_cost !== null}
							<div class="muted" style="font-size: 10px;">cost-known only</div>
						{:else if b.transferred_in_shares > 0 && b.avg_cost === null}
							<div class="muted" style="font-size: 10px;">all transferred in</div>
						{/if}
					</td>
					<td class="mono" style="text-align: right;">{fmtCcy(b.cost_basis, b.currency)}</td>
					<td class="mono muted">{fmtDate(b.last_fill)}</td>
					<td class="mono muted" style="text-align: right;">{b.fills}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

{#if optionBucketsLive.length > 0}
	<h3 class="ph-h3">by account · options</h3>
	<table>
		<thead>
			<tr>
				<th>account</th>
				<th>person</th>
				<th style="width: 70px;">ccy</th>
				<th style="text-align: right;">contracts</th>
				<th style="text-align: right;">net premium</th>
				<th style="width: 100px;">last fill</th>
				<th style="width: 60px; text-align: right;">fills</th>
			</tr>
		</thead>
		<tbody>
			{#each optionBucketsLive as b}
				<tr>
					<td class="mono">{b.account}</td>
					<td class="muted">{b.person}</td>
					<td class="mono muted">{b.currency}</td>
					<td class="mono" style="text-align: right;" class:neg={b.shares_held < 0} class:pos={b.shares_held > 0}>
						{fmtQty(b.shares_held)}
					</td>
					<td class="mono" style="text-align: right;" class:pos={b.net_premium > 0} class:neg={b.net_premium < 0}>
						{fmtCcy(b.net_premium, b.currency, { signed: true })}
					</td>
					<td class="mono muted">{fmtDate(b.last_fill)}</td>
					<td class="mono muted" style="text-align: right;">{b.fills}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

{#if stockBucketsClosed.length > 0}
	<details class="show-more">
		<summary>closed-out account buckets ({stockBucketsClosed.length})</summary>
		<table>
			<thead>
				<tr>
					<th>account</th>
					<th>person</th>
					<th>ccy</th>
					<th style="text-align: right;">fills</th>
					<th style="width: 100px;">last fill</th>
				</tr>
			</thead>
			<tbody>
				{#each stockBucketsClosed as b}
					<tr>
						<td class="mono">{b.account}</td>
						<td class="muted">{b.person}</td>
						<td class="mono muted">{b.currency}</td>
						<td class="mono muted" style="text-align: right;">{b.fills}</td>
						<td class="mono muted">{fmtDate(b.last_fill)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</details>
{/if}

<!-- ============ OPTION TRADES (paired legs) ============ -->
{#if closedOptionTrades.length > 0}
	<h3 class="ph-h3">closed option trades ({closedOptionTrades.length})</h3>
	<div class="trade-list">
		{#each closedOptionTrades as t}
			{@const openPer  = perContract(t.open_premium, t.contracts_opened)}
			{@const closePer = perContract(t.close_premium, t.contracts_closed)}
			<div class="trade-row">
				<div class="trade-head">
					<span class="trade-title">{tradeHeadline(t)}</span>
					<span class="muted mono" style="font-size: 11px;">{t.account}</span>
					<span class="trade-pl" class:pos={t.realized > 0} class:neg={t.realized < 0}>
						{fmtCcy(t.realized, t.currency, { signed: true })}
					</span>
				</div>
				<div class="trade-body muted">
					opened {t.contracts_opened} @ ${openPer.toFixed(2)} on {fmtDate(t.opened_date)}
					&rarr;
					{#if t.close_action === "expire_long" || t.close_action === "expire_short"}
						expired worthless on {fmtDate(t.closed_date)}
					{:else if t.close_action === "assign_short"}
						assigned on {fmtDate(t.closed_date)}
					{:else if t.close_action === "exercise_long"}
						exercised on {fmtDate(t.closed_date)}
					{:else}
						closed {t.contracts_closed} @ ${closePer.toFixed(2)} on {fmtDate(t.closed_date)}
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

{#if openOptionTrades.length > 0}
	<details class="show-more">
		<summary>open / partially closed option trades ({openOptionTrades.length})</summary>
		<div class="trade-list">
			{#each openOptionTrades as t}
				{@const openPer = perContract(t.open_premium, t.contracts_opened)}
				<div class="trade-row">
					<div class="trade-head">
						<span class="trade-title">{tradeHeadline(t)}</span>
						<span class="muted mono" style="font-size: 11px;">{t.account}</span>
						<span class="trade-pl muted">{t.status} · {fmtQty(t.net_contracts)} contracts</span>
					</div>
					<div class="trade-body muted">
						opened {t.contracts_opened} @ ${openPer.toFixed(2)} on {fmtDate(t.opened_date)}
						{#if t.contracts_closed > 0}
							&middot; closed {t.contracts_closed} so far
						{/if}
						&middot; net premium {fmtCcy(t.open_premium + t.close_premium, t.currency, { signed: true })}
					</div>
				</div>
			{/each}
		</div>
	</details>
{/if}

<!-- ============ FILLS TABLE ============ -->
<h3 class="ph-h3">trading activity</h3>
<div class="ph-summary">
	{#each perfCurrencies as ccy}
		{@const buys  = sum.total_buys_by_currency[ccy] ?? 0}
		{@const sells = sum.total_sells_by_currency[ccy] ?? 0}
		{@const net   = sum.realized_by_currency[ccy] ?? 0}
		<div class="ph-stat">
			<div class="ph-label">buys ({ccy})</div>
			<div class="ph-value">{fmtCcy(buys, ccy)}</div>
		</div>
		<div class="ph-stat">
			<div class="ph-label">sells ({ccy})</div>
			<div class="ph-value">{fmtCcy(sells, ccy)}</div>
		</div>
		<div class="ph-stat">
			<div class="ph-label">net realized ({ccy})</div>
			<div class="ph-value {net > 0 ? 'pos' : (net < 0 ? 'neg' : '')}">{fmtCcy(net, ccy, { signed: true })}</div>
		</div>
	{/each}
	{#if sum.win_rate !== null}
		<div class="ph-stat">
			<div class="ph-label">win rate</div>
			<div class="ph-value">
				{(sum.win_rate * 100).toFixed(0)}%
				<span class="muted" style="font-size: 11px;">({sum.winning_trades_count}/{sum.closed_trades_count})</span>
			</div>
		</div>
	{/if}
</div>

<h3 class="ph-h3">fills ({position.fills.length})</h3>
<table>
	<thead>
		<tr>
			<th style="width: 100px;">date</th>
			<th style="width: 140px;">account</th>
			<th style="width: 170px;">what happened</th>
			<th style="width: 80px;">instr</th>
			<th style="text-align: right; width: 80px;">qty</th>
			<th style="text-align: right; width: 100px;">price</th>
			<th style="text-align: right; width: 130px;">net cash</th>
			<th style="text-align: right; width: 100px;">pos after</th>
			<th>option</th>
		</tr>
	</thead>
	<tbody>
		{#each recentFills as e}
			<tr>
				<td class="mono muted">{fmtDate(e.date)}</td>
				<td class="mono">{e.account}</td>
				<td>
					<div>{verbOf(e)}</div>
					<div class="muted mono" style="font-size: 10px;">{e.action}</div>
				</td>
				<td class="mono muted">{e.instrument}</td>
				<td class="mono" style="text-align: right;">{e.quantity ?? '—'}</td>
				<td class="mono" style="text-align: right;">{fmtCcy(e.price, e.currency)}</td>
				<td class="mono" style="text-align: right;" class:pos={(e.net_cash ?? 0) > 0} class:neg={(e.net_cash ?? 0) < 0}>
					{fmtCcy(e.net_cash, e.currency, { signed: true })}
				</td>
				<td class="mono" style="text-align: right;" class:pos={(e.position_after ?? 0) > 0} class:neg={(e.position_after ?? 0) < 0}>
					{e.position_after !== undefined ? fmtQty(e.position_after) : '—'}
				</td>
				<td class="mono muted">
					{#if e.option}
						{e.option.strike}{(e.option.right ?? '').toUpperCase().charAt(0)} {e.option.side} exp {fmtDate(e.option.expiry)}
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

{#if olderFills.length > 0}
	<details class="show-more">
		<summary>show {olderFills.length} older fills</summary>
		<table>
			<thead>
				<tr>
					<th style="width: 100px;">date</th>
					<th style="width: 140px;">account</th>
					<th style="width: 170px;">what happened</th>
					<th style="width: 80px;">instr</th>
					<th style="text-align: right; width: 80px;">qty</th>
					<th style="text-align: right; width: 100px;">price</th>
					<th style="text-align: right; width: 130px;">net cash</th>
					<th style="text-align: right; width: 100px;">pos after</th>
					<th>option</th>
				</tr>
			</thead>
			<tbody>
				{#each olderFills as e}
					<tr>
						<td class="mono muted">{fmtDate(e.date)}</td>
						<td class="mono">{e.account}</td>
						<td>
							<div>{verbOf(e)}</div>
							<div class="muted mono" style="font-size: 10px;">{e.action}</div>
						</td>
						<td class="mono muted">{e.instrument}</td>
						<td class="mono" style="text-align: right;">{e.quantity ?? '—'}</td>
						<td class="mono" style="text-align: right;">{fmtCcy(e.price, e.currency)}</td>
						<td class="mono" style="text-align: right;" class:pos={(e.net_cash ?? 0) > 0} class:neg={(e.net_cash ?? 0) < 0}>
							{fmtCcy(e.net_cash, e.currency, { signed: true })}
						</td>
						<td class="mono" style="text-align: right;" class:pos={(e.position_after ?? 0) > 0} class:neg={(e.position_after ?? 0) < 0}>
							{e.position_after !== undefined ? fmtQty(e.position_after) : '—'}
						</td>
						<td class="mono muted">
							{#if e.option}
								{e.option.strike}{(e.option.right ?? '').toUpperCase().charAt(0)} {e.option.side} exp {fmtDate(e.option.expiry)}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</details>
{/if}

<style>
	.ph-perf {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;
	}
	.ph-perf-card {
		flex: 1 1 460px;
		padding: 14px 16px;
		background: var(--panel, rgba(255,255,255,0.02));
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.ph-perf-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 10px;
	}
	.ph-perf-ccy {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
	}
	.ph-perf-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 16px;
	}
	.ph-hero {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 10px;
		padding-bottom: 12px;
		margin-bottom: 12px;
		border-bottom: 1px solid var(--border);
	}
	.ph-hero-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		align-self: center;
	}
	.ph-hero-value {
		font-family: var(--mono);
		font-size: 32px;
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.01em;
	}
	.ph-hero-pct {
		font-family: var(--mono);
		font-size: 16px;
		font-weight: 600;
	}
	.ph-insights {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		padding: 10px 14px;
		margin-bottom: 16px;
		font-size: 12px;
		background: var(--panel, rgba(255,255,255,0.02));
		border: 1px solid var(--border);
		border-radius: 6px;
	}
	.ph-insight {
		display: inline-flex;
		gap: 6px;
		align-items: baseline;
	}
	.ph-summary {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		padding: 16px;
		background: var(--panel, rgba(255,255,255,0.02));
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-bottom: 16px;
	}
	.ph-stat { min-width: 120px; }
	.ph-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		margin-bottom: 4px;
	}
	.ph-value {
		font-family: var(--mono);
		font-size: 18px;
		font-weight: 600;
	}
	.ph-h3 {
		font-size: 13px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		margin: 20px 0 8px 0;
		font-weight: 500;
	}
	.trade-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.trade-row {
		padding: 8px 10px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--panel, rgba(255,255,255,0.02));
	}
	.trade-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	.trade-title {
		font-weight: 600;
		font-family: var(--mono);
	}
	.trade-pl {
		margin-left: auto;
		font-family: var(--mono);
		font-weight: 600;
	}
	.trade-body {
		font-size: 12px;
		margin-top: 4px;
	}
	.pos { color: var(--pos, #5bd17f); }
	.neg { color: var(--neg, #f08585); }
</style>
