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

export type LedgerExecution = {
	id: string;
	date: string;             // ISO YYYY-MM-DD
	action: string;
	instrument: string;       // us_stock | cdr | etf | option | cash
	symbol: string;
	quantity: number | null;
	price: number | null;
	currency: string | null;
	fees: number | null;
	net_cash: number | null;
	account: string;          // slug from ledger frontmatter
	person: string;
	option: { right: string; side: string; strike: number; expiry: string } | null;
	source: string;
	notes: string | null;
	// Server-enriched. Signed running balance in this fill's (account, instrument-bucket)
	// after this fill is applied — shares for stocks, signed contracts for options.
	position_after?: number;
};

export type AccountPosition = {
	account: string;
	person: string;
	status: string;           // active | closed
	currency: string;
	kind: "stock" | "option";
	shares_held: number;      // signed: + long, - short. For options: signed contracts.
	cost_basis: number;       // cash spent acquiring currently-held shares (positive for long)
	avg_cost: number | null;
	net_premium: number;      // options only: cumulative net cash on this contract bucket
	fills: number;
	last_fill: string | null;
	transferred_in_shares: number;  // shares acquired via transfer_in (cost basis unknown)
	realized: number;         // FIFO-matched realized P&L within this bucket (stock kind)
	closed_lot_count: number; // closed lot count for this bucket
	winning_lot_count: number;// closed lots with realized > 0
};

export type PositionSummary = {
	realized_stock_by_currency:  Record<string, number>;
	realized_option_by_currency: Record<string, number>;
	realized_by_currency:        Record<string, number>;
	unrealized_by_currency:      Record<string, number>;
	total_return_by_currency:    Record<string, number>;
	total_return_pct_by_currency: Record<string, number | null>;
	total_buys_by_currency:      Record<string, number>;
	total_sells_by_currency:     Record<string, number>;
	closed_trades_count: number;
	winning_trades_count: number;
	win_rate: number | null;       // 0..1 or null if no closed trades
	peak_long_shares: number;
	current_long_shares: number;
	turnover_pct: number | null;   // total close qty / peak long, or null if peak=0
	avg_cost_by_currency:        Record<string, number>;
	current_shares_by_currency:  Record<string, number>;
	live_price: number | null;
	live_currency: string | null;
	live_unmatched_currencies: string[]; // buckets whose ccy != live ccy, so unrealized not computed
};

export type OptionTrade = {
	account: string;
	currency: string;
	symbol: string;
	right: string;            // C | P
	side: string;             // long | short
	strike: number;
	expiry: string;
	contracts_opened: number;
	contracts_closed: number;
	net_contracts: number;    // signed; 0 = fully closed
	open_premium: number;     // sum of net_cash on opening legs (negative if long, positive if short)
	close_premium: number;    // sum of net_cash on closing legs
	realized: number;         // sum of net_cash across all legs; meaningful if net_contracts == 0
	opened_date: string;      // first open leg
	closed_date: string | null; // last closing leg if any
	status: "open" | "closed" | "partial";
	close_action: string | null; // primary action on the last close (sell, expire_long, etc.)
	legs: LedgerExecution[];
};

export type PositionHistory = {
	total_long_shares: number;
	total_short_shares: number;
	cost_basis_by_currency: Record<string, number>;
	open_option_contracts: number;
	by_account: AccountPosition[];
	option_trades: OptionTrade[]; // grouped option legs; closed trades show realized P&L
	fills: LedgerExecution[];   // all fills for this symbol, desc by date
	summary: PositionSummary;
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
	position: PositionHistory | null;
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

