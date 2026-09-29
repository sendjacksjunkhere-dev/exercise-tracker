import { fetchPlanRows } from "./sheets";
import { parsePlanRows, type PlanDay } from "./planParser";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { data: PlanDay[]; expiresAt: number } | null = null;

export async function getPlan(): Promise<PlanDay[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const rows = await fetchPlanRows();
  const data = parsePlanRows(rows);
  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}
