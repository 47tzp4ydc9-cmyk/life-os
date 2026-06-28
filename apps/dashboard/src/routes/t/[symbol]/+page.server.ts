import { getTickerPage } from "$lib/server/repo";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	if (!params.symbol || !/^[A-Za-z][A-Za-z.\-]{0,9}$/.test(params.symbol)) {
		throw error(400, "Bad symbol");
	}
	return { page: await getTickerPage(params.symbol) };
};
