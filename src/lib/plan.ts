import { fetchPlanRows } from "./sheets";
import { getPlanWarnings, parsePlanRows, type PlanDay } from "./planParser";

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { data: PlanDay[]; warnings: string[]; expiresAt: number } | null = null;

async function ensureCache() {
  if (cache && cache.expiresAt > Date.now()) {
    return cache;
  }

  const rows = await fetchPlanRows();
  const data = parsePlanRows(rows);
  const warnings = getPlanWarnings(rows);
  cache = { data, warnings, expiresAt: Date.now() + CACHE_TTL_MS };
  return cache;
}

export async function getPlan(): Promise<PlanDay[]> {
  const { data } = await ensureCache();
  return data;
}

export async function getPlanWarningMessages(): Promise<string[]> {
  const { warnings } = await ensureCache();
  return warnings;
}
