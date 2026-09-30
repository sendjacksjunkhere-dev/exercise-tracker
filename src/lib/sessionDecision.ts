export type StartSessionDecision = "create" | "discardAndCreate" | "blocked";

export function decideStartSession(
  existing: { hasLoggedSets: boolean } | null
): StartSessionDecision {
  if (!existing) return "create";
  return existing.hasLoggedSets ? "blocked" : "discardAndCreate";
}
