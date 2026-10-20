export function nextTargetSets(currentTarget: number, loggedCount: number): number {
  return Math.max(currentTarget, loggedCount);
}
