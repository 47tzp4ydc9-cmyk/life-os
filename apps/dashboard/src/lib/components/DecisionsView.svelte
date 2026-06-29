<script lang="ts">
	import type { DecisionData } from "$lib/types";
	import { relTime, fmtDate } from "$lib/format";

	type Props = { decisions: DecisionData[] };
	let { decisions }: Props = $props();

	let view = $state<"table" | "cards">("table");

	// ---- action math ----
	// Sign convention for qty labels in the table view.
	// roll / rotate are position-management actions: no change in shares/contracts.
	function actionSign(a: string): -1 | 0 | 1 {
		switch (a) {
			case "buy":
			case "add":
				return 1;
			case "sell":
			case "trim":
			case "close":
				return -1;
			default:
				return 0;
		}
	}
	function qtyLabel(d: DecisionData): string {
		const s = actionSign(d.action);
		const q = d.quantity ?? 0;
		if (s === 0) return q ? `${q}` : "—";
		return `${s > 0 ? "+" : "−"}${q}`;
	}

	const recentFirst = $derived(
		[...decisions].sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""))
	);

	// expanded-row state for table view
	let expanded = $state<Record<string, boolean>>({});
	function toggleRow(key: string) { expanded[key] = !expanded[key]; }
</script>

<div class="section-head">
	<h2>decisions <span class="muted mono" style="font-size: 12px; font-weight: normal;">({decisions.length})</span></h2>
	<div class="seg-toggle" role="tablist">
		<button class:active={view === "table"} onclick={() => (view = "table")} role="tab">table</button>
		<button class:active={view === "cards"} onclick={() => (view = "cards")} role="tab">cards</button>
	</div>
</div>

{#if view === "table"}
	<p class="muted" style="font-size: 12px; margin: 4px 0 8px;">hover a row for details · click to pin</p>
	<div class="dec-list">
		{#each recentFirst as d (d.path)}
			{@const sign = actionSign(d.action)}
			<div
				class="dec-row"
				class:expanded={expanded[d.path]}
				onclick={() => toggleRow(d.path)}
				onkeydown={(e) => e.key === "Enter" && toggleRow(d.path)}
				role="button"
				tabindex="0"
			>
				<div class="dec-summary">
					<span class="when" title={fmtDate(d.created)}>{relTime(d.created)}</span>
					<span class="act-pill {d.action}">{d.action}</span>
					<span class="qty" class:pos={sign > 0} class:neg={sign < 0}>{qtyLabel(d)}</span>
					<span class="title">{d.title || "(untitled)"}</span>
					<span class="conf">{d.confidence ?? "—"}/10</span>
				</div>
				<div class="dec-detail">
					{#if d.lede_html}
						<div class="md">{@html d.lede_html}</div>
					{:else}
						<span class="muted">(no summary)</span>
					{/if}
					<div class="muted mono" style="font-size: 11px; margin-top: 6px;">{d.path}</div>
				</div>
			</div>
		{/each}
	</div>
{:else}
	{#each recentFirst as d (d.path)}
		<div class="panel">
			<div class="row" style="justify-content: space-between;">
				<div>
					<span class="mono"><strong>{fmtDate(d.created)}</strong></span>
					<span class="act-pill {d.action}" style="margin-left: 6px;">{d.action}</span>
					{#if d.quantity}<span class="muted mono"> qty {d.quantity}</span>{/if}
					{#if d.confidence}<span class="muted"> · conf {d.confidence}/10</span>{/if}
				</div>
				<span class="muted mono" style="font-size: 11px;">{d.path}</span>
			</div>
			{#if d.title}<div style="font-weight: 600; margin-top: 6px;">{d.title}</div>{/if}
			<div class="md" style="margin-top: 8px;">{@html d.body_html}</div>
		</div>
	{/each}
{/if}
