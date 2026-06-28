import { listTickers } from "$lib/server/repo";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	return { tickers: await listTickers() };
};
