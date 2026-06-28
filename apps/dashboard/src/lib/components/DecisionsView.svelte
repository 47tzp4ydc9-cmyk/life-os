<script lang="ts">
	import type { DecisionData } from "$lib/types";
	import { relTime, fmtDate } from "$lib/format";

	type Props = { decisions: DecisionData[] };
	let { decisions }: Props = $props();

	let view = $state<"timeline" | "table" | "cards">("timeline");

	// ---- action math ----
	// Sign convention for cumulative-quantity charts.
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
	function signedQty(d: DecisionData): number {
		return actionSign(d.action) * (d.quantity ?? 0);
	}
	function qtyLabel(d: DecisionData): string {
		const s = actionSign(d.action);
		const q = d.quantity ?? 0;
		if (s === 0) return q ? `${q}` : "—";
		return `${s > 0 ? "+" : "−"}${q}`;
	}

	// ---- sorted chronologically (oldest first) for charts; reverse for tables ----
	const chronological = $derived(
		[...decisions].sort((a, b) => (a.created ?? "").localeCompare(b.created ?? ""))
	);
	const recentFirst = $derived(
		[...decisions].sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""))
	);

	// ---- timeline scales ----
	const W = 880;
	const H = 200;
	const PAD = { t: 24, r: 24, b: 36, l: 40 };
	const innerW = W - PAD.l - PAD.r;
	const innerH = H - PAD.t - PAD.b;

	type Pt = { x: number; y: number; d: DecisionData; cum: number };

	const points = $derived.by<Pt[]>(() => {
		if (chronological.length === 0) return [];
		const dates = chronological.map((d) => Date.parse(d.created ?? "")).filter((t) => !Number.isNaN(t));
		if (dates.length === 0) return [];
		const tMin = Math.min(...dates);
		const tMax = Math.max(...dates, Date.now());
		const tRange = Math.max(tMax - tMin, 86400000);
		let cum = 0;
		const cums: number[] = [];
		for (const d of chronological) cums.push((cum += signedQty(d)));
		const cMin = Math.min(0, ...cums);
		const cMax = Math.max(0, ...cums);
		const cRange = Math.max(cMax - cMin, 1);
		return chronological.map((d, i) => {
			const t = Date.parse(d.created ?? "");
			const x = PAD.l + ((t - tMin) / tRange) * innerW;
			const y = PAD.t + innerH - ((cums[i] - cMin) / cRange) * innerH;
			return { x, y, d, cum: cums[i] };
		});
	});

	const pathD = $derived(
		points.length > 0
			? points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")
			: ""
	);

	const xTicks = $derived.by(() => {
		if (chronological.length === 0) return [] as { x: number; label: string }[];
		const dates = chronological.map((d) => Date.parse(d.created ?? "")).filter((t) => !Number.isNaN(t));
		const tMin = Math.min(...dates);
		const tMax = Math.max(...dates, Date.now());
		const tRange = Math.max(tMax - tMin, 86400000);
		const n = 4;
		const out: { x: number; label: string }[] = [];
		for (let i = 0; i <= n; i++) {
			const t = tMin + (tRange * i) / n;
			const x = PAD.l + ((t - tMin) / tRange) * innerW;
			const d = new Date(t);
			out.push({ x, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
		}
		return out;
	});

	function actionColorVar(a: string): string {
		switch (a) {
			case "buy": case "add": return "var(--act-buy)";
			case "sell": return "var(--act-sell)";
			case "trim": return "var(--act-trim)";
			case "close": return "var(--act-close)";
			case "roll": return "var(--act-roll)";
			case "rotate": return "var(--act-rotate)";
			default: return "var(--text-dim)";
		}
	}

	// hover tooltip state for timeline
	let hover = $state<{ pt: Pt; cx: number; cy: number } | null>(null);

	function onDotEnter(e: MouseEvent, pt: Pt) {
		const target = e.currentTarget as SVGElement;
		const svg = target.ownerSVGElement!;
		const rect = svg.getBoundingClientRect();
		const containerRect = (svg.parentElement as HTMLElement).getBoundingClientRect();
		// svg viewport coords scale; convert via getBoundingClientRect of the dot
		const dotRect = target.getBoundingClientRect();
		hover = {
			pt,
			cx: dotRect.left - containerRect.left + dotRect.width / 2,
			cy: dotRect.top - containerRect.top
		};
	}
	function onDotLeave() { hover = null; }

	// expanded-row state for table view
	let expanded = $state<Record<string, boolean>>({});
	function toggleRow(key: string) { expanded[key] = !expanded[key]; }
</script>

<div class="section-head">
	<h2>decisions <span class="muted mono" style="font-size: 12px; font-weight: normal;">({decisions.length})</span></h2>
	<div class="seg-toggle" role="tablist">
		<button class:active={view === "timeline"} onclick={() => (view = "timeline")} role="tab">timeline</button>
		<button class:active={view === "table"} onclick={() => (view = "table")} role="tab">table</button>
		<button class:active={view === "cards"} onclick={() => (view = "cards")} role="tab">cards</button>
	</div>
</div>

{#if view === "timeline"}
	<div class="timeline">
		{#if points.length === 0}
			<p class="muted">no decisions with valid dates.</p>
		{:else}
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet">
				<g class="axis">
					<line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} />
					{#each xTicks as t}
						<line x1={t.x} y1={H - PAD.b} x2={t.x} y2={H - PAD.b + 4} />
						<text x={t.x} y={H - PAD.b + 16} text-anchor="middle">{t.label}</text>
					{/each}
				</g>
				<g class="axis">
					<text x={PAD.l - 6} y={PAD.t} text-anchor="end" dominant-baseline="middle">qty</text>
					<text x={PAD.l - 6} y={H - PAD.b} text-anchor="end" dominant-baseline="middle">0</text>
				</g>
				<path class="cum-line" d={pathD} />
				{#each points as pt}
					<circle
						class="event-dot"
						cx={pt.x}
						cy={pt.y}
						r="6"
						fill={actionColorVar(pt.d.action)}
						role="img"
						aria-label="{pt.d.action} {pt.d.quantity ?? ''} on {pt.d.created}"
						onmouseenter={(e) => onDotEnter(e, pt)}
						onmouseleave={onDotLeave}
					/>
					<text class="event-label" x={pt.x} y={pt.y - 10} text-anchor="middle">{qtyLabel(pt.d)}</text>
				{/each}
			</svg>

			{#if hover}
				<div class="tt" style="left: {hover.cx + 14}px; top: {Math.max(0, hover.cy - 8)}px;">
					<div class="tt-head">{fmtDate(hover.pt.d.created)} · {relTime(hover.pt.d.created)}</div>
					<div class="tt-title">
						<span class="act-pill {hover.pt.d.action}">{hover.pt.d.action}</span>
						<span class="mono" style="margin-left: 6px;">{qtyLabel(hover.pt.d)}</span>
					</div>
					{#if hover.pt.d.title}
						<div style="margin: 4px 0;">{hover.pt.d.title}</div>
					{/if}
					<div class="tt-meta">
						{#if hover.pt.d.confidence}conf {hover.pt.d.confidence}/10 · {/if}
						cumulative: {hover.pt.cum >= 0 ? "+" : ""}{hover.pt.cum}
					</div>
				</div>
			{/if}

			<div class="timeline-legend">
				<span><span class="dot" style="background: var(--act-buy);"></span>buy/add</span>
				<span><span class="dot" style="background: var(--act-sell);"></span>sell</span>
				<span><span class="dot" style="background: var(--act-trim);"></span>trim</span>
				<span><span class="dot" style="background: var(--act-close);"></span>close</span>
				<span><span class="dot" style="background: var(--act-roll);"></span>roll/rotate</span>
				<span style="margin-left: auto;">line = cumulative signed qty</span>
			</div>
		{/if}
	</div>
{:else if view === "table"}
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
