<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<h1>tickers</h1>
<p class="muted">{data.tickers.length} symbols discovered across narrative/.</p>

<div class="ticker-grid">
	{#each data.tickers as t (t.symbol)}
		<a class="ticker-card" href={`/t/${t.symbol}`}>
			<div class="sym">{t.symbol}</div>
			<div class="meta">
				{#if t.has_thesis}<span class="badge accent">thesis</span>{/if}
				{#if t.has_open_option}<span class="badge yellow">opt</span>{/if}
				{#if t.upcoming_catalysts > 0}<span class="badge red">cat×{t.upcoming_catalysts}</span>{/if}
				{#if t.open_action_items > 0}<span class="badge red">todo×{t.open_action_items}</span>{/if}
				{#if t.on_watchlist}<span class="badge">watch</span>{/if}
			</div>
		</a>
	{/each}
</div>
