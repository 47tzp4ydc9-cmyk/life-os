// Shared types for the dashboard.
// All data flows server → client as plain JSON.
// Date fields are normalized to ISO `YYYY-MM-DD` strings on the server.

export type Severity = "red" | "yellow" | "green";

export type LivePrice = {
	symbol: string;
	price: number | null;
	day_change_pct: number | null;
	currency: string | null;
	market_state: string | null;
	fetched_at: string;
	error?: string;
};

export type FileRef = {
	path: string;        // repo-relative
	type: string;        // frontmatter `type`
	created?: string;    // ISO YYYY-MM-DD
	updated?: string;    // ISO YYYY-MM-DD
	status?: string;
};

export type ThesisData = FileRef & {
	frontmatter: Record<string, unknown>;
	summary_html: string;     // just the ## Summary section
	body_html: string;        // full body
	age_days: number | null;
	conviction: number | null;
	horizon: string | null;
	key_metrics: string[];
	disconfirming: string[];
};

export type DecisionData = FileRef & {
	action: string;
	quantity?: number;
	confidence?: number;
	title: string;            // first H1 of body, or filename slug
	lede_html: string;        // first paragraph
	body_html: string;        // full body
};

export type OptionData = FileRef & {
	side: string;
	right: string;
	current_strike: number;
	current_expiry: string;   // ISO YYYY-MM-DD
	original_strike: number | null;
	original_expiry: string | null;
	dte: number | null;
	net_premium: number;
	contracts: number;
	rolls: number;
	lede_html: string;
	body_html: string;
};

export type CatalystData = FileRef & {
	event_date: string;       // ISO YYYY-MM-DD
	category: string;
	direction: string;
	confidence: string;
	days_until: number | null;
	body_html: string;
};

export type ActionItem = {
	text: string;
	priority: string | null;
	due: string | null;
	account: string | null;
	completed?: string;
};

export type TickerPage = {
	symbol: string;
	as_of: string;
	live: LivePrice;
	thesis: ThesisData | null;
	decisions: DecisionData[];
	options: OptionData[];
	catalysts: { upcoming: CatalystData[]; past: CatalystData[] };
	action_items: ActionItem[];
	watchlist_entry: Record<string, string> | null;
	computed: {
		days_since_last_decision: number | null;
		days_since_thesis_update: number | null;
		next_catalyst_in_days: number | null;
	};
};

export type TickerSummary = {
	symbol: string;
	has_thesis: boolean;
	has_open_option: boolean;
	open_action_items: number;
	upcoming_catalysts: number;
	on_watchlist: boolean;
};

