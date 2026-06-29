<script lang="ts">
	import type { PageData } from './$types';
	import type { OptionData } from '$lib/types';
	import { fmtUsd, fmtPct, fmtDate, relTime, dteSeverity, prioritySeverity } from '$lib/format';
	import DecisionsView from '$lib/components/DecisionsView.svelte';
	import PositionHistoryView from '$lib/components/PositionHistoryView.svelte';

	let { data }: { data: PageData } = $props();
	const p = $derived(data.page);

	function convictionTier(c: number | null): "low" | "" | "high" {
		if (c === null) return "";
		if (c >= 8) return "high";
		if (c <= 4) return "low";
		return "";
	}

	// Compute strike-vs-price bar geometry for a single option.
	// Window is centered on max(price, strike) ± 30%.
	function strikeBar(o: OptionData, price: number | null) {
		const anchor = price ?? o.current_strike;
		const lo = anchor * 0.7;
		const hi = anchor * 1.3;
		const range = hi - lo;
		const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / range) * 100));
		const strikePct = pct(o.current_strike);
		const pricePct = price !== null ? pct(price) : null;
		const origPct = o.original_strike !== null ? pct(o.original_strike) : null;
		// For a short put: ITM when price < strike (left of strike is ITM).
		// For a short call: ITM when price > strike (right of strike is ITM).
		const itmIsLeft = (o.right ?? '').toLowerCase().startsWith('p') === (o.side === 'short');
		return { strikePct, pricePct, origPct, itmIsLeft };
	}
</script>

<!-- ============ HERO ============ -->
<div class="hero">
	<div class="sym">{p.symbol}</div>

	<div class="price-block">
		{#if p.live.price !== null}
			<div class="price">{fmtUsd(p.live.price)}</div>
			<div class="change {p.live.day_change_pct !== null && p.live.day_change_pct >= 0 ? 'pos' : 'neg'}">
				{fmtPct(p.live.day_change_pct)} today
			</div>
		{:else}
			<div class="muted">price unavailable{p.live.error ? ` — ${p.live.error}` : ''}</div>
		{/if}
	</div>

	<div class="meta">
		{#if p.live.market_state}<div>{p.live.market_state}</div>{/if}
		{#if p.live.currency}<div>{p.live.currency}</div>{/if}
	</div>
</div>

<!-- ============ KPI STRIP ============ -->
<div class="kpi-row">
	{#if p.thesis}
		{@const conv = p.thesis.conviction ?? 0}
		{@const tier = convictionTier(p.thesis.conviction)}
		<div class="kpi {tier === 'high' ? 'green' : tier === 'low' ? 'yellow' : 'accent'}">
			<div class="kpi-label">conviction</div>
			<div class="kpi-value">{p.thesis.conviction ?? '—'}<span class="muted" style="font-size: 14px;">/10</span></div>
			<div class="kpi-sub">
				<span class="conv-dots {tier}">
					{#each Array(10) as _, i}
						<span class="d" class:on={i < conv}></span>
					{/each}
				</span>
			</div>
		</div>
	{/if}

	{#if p.options.length > 0}
		{@const nearest = p.options.reduce((m, o) => (o.dte ?? 9999) < (m.dte ?? 9999) ? o : m, p.options[0])}
		{@const sev = dteSeverity(nearest.dte)}
		<div class="kpi {sev}">
			<div class="kpi-label">open options</div>
			<div class="kpi-value">{p.options.length}</div>
			<div class="kpi-sub">nearest exp <span class="dte-pill {sev}">{nearest.dte ?? '—'}d</span></div>
		</div>
	{/if}

	{#if p.catalysts.upcoming.length > 0}
		{@const next = p.catalysts.upcoming[0]}
		{@const sev = dteSeverity(next.days_until)}
		<div class="kpi {sev}">
			<div class="kpi-label">next catalyst</div>
			<div class="kpi-value">{next.days_until}<span class="muted" style="font-size: 14px;">d</span></div>
			<div class="kpi-sub">{next.category} · {fmtDate(next.event_date)}</div>
		</div>
	{/if}

	{#if p.action_items.length > 0}
		{@const hasHigh = p.action_items.some(a => a.priority === 'high')}
		<div class="kpi {hasHigh ? 'red' : 'yellow'}">
			<div class="kpi-label">action items</div>
			<div class="kpi-value">{p.action_items.length}</div>
			<div class="kpi-sub">{hasHigh ? 'high priority open' : 'open'}</div>
		</div>
	{/if}

	{#if p.computed.days_since_last_decision !== null}
		<div class="kpi">
			<div class="kpi-label">last decision</div>
			<div class="kpi-value">{p.computed.days_since_last_decision}<span class="muted" style="font-size: 14px;">d</span></div>
			<div class="kpi-sub">ago</div>
		</div>
	{/if}
</div>

<!-- ============ ACTION ITEMS ============ -->
{#if p.action_items.length > 0}
	<div class="section-head"><h2>action items</h2></div>
	<table>
		<thead>
			<tr><th style="width: 80px;">priority</th><th style="width: 100px;">due</th><th>task</th><th style="width: 120px;">account</th></tr>
		</thead>
		<tbody>
			{#each p.action_items as a}
				{@const sev = prioritySeverity(a.priority)}
				<tr>
					<td>
						{#if a.priority}
							<span class="badge {sev === 'muted' ? '' : sev}">{a.priority}</span>
						{/if}
					</td>
					<td class="mono muted">{fmtDate(a.due)}</td>
					<td>{a.text}</td>
					<td class="mono muted">{a.account ?? ''}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<!-- ============ OPTIONS ============ -->
{#if p.options.length > 0}
	<div class="section-head"><h2>open options</h2></div>
	{#each p.options as o}
		{@const sev = dteSeverity(o.dte)}
		{@const sb = strikeBar(o, p.live.price)}
		<div class="opt-card">
			<div class="opt-head">
				<div>
					<span class="opt-title">{o.contracts}× {o.current_strike}{o.right.toUpperCase().charAt(0)}</span>
					<span class="opt-sub">{o.side} · exp {fmtDate(o.current_expiry)}</span>
				</div>
				<div class="row" style="gap: 8px;">
					<span class="dte-pill {sev}">{o.dte !== null ? `${o.dte}d` : '—'}</span>
					{#if o.rolls > 0}<span class="badge accent">{o.rolls} roll{o.rolls === 1 ? '' : 's'}</span>{/if}
				</div>
			</div>

			<div class="strike-bar" aria-label="strike vs current price">
				{#if sb.itmIsLeft}
					<div class="zone itm" style="left: 0; width: {sb.strikePct}%;"></div>
					<div class="zone otm" style="left: {sb.strikePct}%; right: 0;"></div>
				{:else}
					<div class="zone otm" style="left: 0; width: {sb.strikePct}%;"></div>
					<div class="zone itm" style="left: {sb.strikePct}%; right: 0;"></div>
				{/if}
				{#if sb.origPct !== null && o.original_strike !== o.current_strike}
					<div class="mark original" style="left: {sb.origPct}%;"></div>
					<div class="label original" style="left: {sb.origPct}%;">orig {o.original_strike}</div>
				{/if}
				<div class="mark strike" style="left: {sb.strikePct}%;"></div>
				<div class="label strike" style="left: {sb.strikePct}%;">strike {o.current_strike}</div>
				{#if sb.pricePct !== null}
					<div class="mark price" style="left: {sb.pricePct}%;"></div>
					<div class="label price" style="left: {sb.pricePct}%;">{fmtUsd(p.live.price)}</div>
				{/if}
			</div>

			<div class="opt-metrics">
				<span>net premium <strong class={o.net_premium >= 0 ? 'pos' : 'neg'}>{fmtUsd(o.net_premium)}</strong></span>
				{#if o.original_expiry && o.original_expiry !== o.current_expiry}
					<span>original exp <strong>{fmtDate(o.original_expiry)}</strong></span>
				{/if}
				{#if p.live.price !== null}
					{@const moneyness = ((p.live.price - o.current_strike) / o.current_strike) * 100}
					<span>price vs strike <strong class={moneyness >= 0 ? 'pos' : 'neg'}>{fmtPct(moneyness)}</strong></span>
				{/if}
			</div>

			{#if o.lede_html}
				<div class="opt-lede md">{@html o.lede_html}</div>
			{/if}

			<details class="show-more">
				<summary>show full notes</summary>
				<div class="md">{@html o.body_html}</div>
				<div class="muted mono" style="font-size: 11px; margin-top: 8px;">{o.path}</div>
			</details>
		</div>
	{/each}
{/if}

<!-- ============ THESIS ============ -->
{#if p.thesis}
	{@const tier = convictionTier(p.thesis.conviction)}
	<div class="section-head"><h2>thesis</h2></div>
	<div class="thesis-card">
		<div class="th-head">
			<div class="row" style="gap: 8px;">
				<span class="badge {p.thesis.status === 'active' ? 'green' : ''}">{p.thesis.status ?? '?'}</span>
				{#if p.thesis.horizon}<span class="badge">{p.thesis.horizon}</span>{/if}
			</div>
			<div class="th-conv">
				<span>conviction</span>
				<span class="conv-dots {tier}">
					{#each Array(10) as _, i}
						<span class="d" class:on={i < (p.thesis.conviction ?? 0)}></span>
					{/each}
				</span>
				<strong style="color: var(--text);">{p.thesis.conviction ?? '—'}/10</strong>
			</div>
		</div>

		{#if p.thesis.summary_html}
			<div class="th-summary md">{@html p.thesis.summary_html}</div>
		{/if}

		{#if p.thesis.key_metrics.length > 0 || p.thesis.disconfirming.length > 0}
			<div class="chip-grid">
				{#if p.thesis.key_metrics.length > 0}
					<div class="chip-col win">
						<h4><span class="icon">✓</span>watching for</h4>
						<div class="chips">
							{#each p.thesis.key_metrics as k}<span class="chip win">{k}</span>{/each}
						</div>
					</div>
				{/if}
				{#if p.thesis.disconfirming.length > 0}
					<div class="chip-col lose">
						<h4><span class="icon">✗</span>killed by</h4>
						<div class="chips">
							{#each p.thesis.disconfirming as k}<span class="chip lose">{k}</span>{/each}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<div class="muted mono" style="font-size: 11px;">
			updated {fmtDate(p.thesis.updated)} · {p.thesis.path}
		</div>

		<details class="show-more">
			<summary>show full thesis</summary>
			<div class="md">{@html p.thesis.body_html}</div>
		</details>
	</div>
{/if}

<!-- ============ CATALYSTS ============ -->
{#if p.catalysts.upcoming.length > 0 || p.catalysts.past.length > 0}
	<div class="section-head"><h2>catalysts</h2></div>
	{#if p.catalysts.upcoming.length > 0}
		<table>
			<thead><tr><th style="width: 100px;">date</th><th style="width: 70px;">in</th><th>category</th><th style="width: 80px;">direction</th><th style="width: 90px;">confidence</th></tr></thead>
			<tbody>
				{#each p.catalysts.upcoming as c}
					{@const sev = dteSeverity(c.days_until)}
					<tr>
						<td class="mono">{fmtDate(c.event_date)}</td>
						<td><span class="dte-pill {sev}">{c.days_until !== null ? `${c.days_until}d` : '—'}</span></td>
						<td>{c.category}</td>
						<td>{c.direction}</td>
						<td class="muted">{c.confidence}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	{#if p.catalysts.past.length > 0}
		<details class="show-more" style="margin-top: 16px;">
			<summary>past catalysts ({p.catalysts.past.length})</summary>
			<table>
				<thead><tr><th>date</th><th>category</th></tr></thead>
				<tbody>
					{#each p.catalysts.past as c}
						<tr><td class="mono">{fmtDate(c.event_date)}</td><td>{c.category}</td></tr>
					{/each}
				</tbody>
			</table>
		</details>
	{/if}
{/if}

<!-- ============ DECISIONS (toggle: timeline | table | cards) ============ -->
{#if p.decisions.length > 0}
	<DecisionsView decisions={p.decisions} />
{/if}

<!-- ============ POSITION HISTORY (from ledger) ============ -->
{#if p.position}
	<PositionHistoryView position={p.position} />
{/if}

<!-- ============ WATCHLIST ============ -->
{#if p.watchlist_entry}
	<div class="section-head"><h2>watchlist</h2></div>
	<div class="panel mono" style="font-size: 13px;">
		{#each Object.entries(p.watchlist_entry) as [k, v]}
			{#if v}
				<div><span class="muted">{k}:</span> {v}</div>
			{/if}
		{/each}
	</div>
{/if}

{#if !p.thesis && p.decisions.length === 0 && p.options.length === 0 && p.catalysts.upcoming.length === 0 && p.catalysts.past.length === 0 && p.action_items.length === 0 && !p.watchlist_entry && !p.position}
	<p class="muted">no narrative data found for <span class="mono">{p.symbol}</span>.</p>
{/if}

<p class="muted mono" style="font-size: 11px; margin-top: 40px;">as of {p.as_of}</p>
