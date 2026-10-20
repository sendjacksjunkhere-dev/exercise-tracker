import { describe, expect, it } from "vitest";
import { nextTargetSets } from "./targetSets";

describe("nextTargetSets", () => {
  it("keeps the target unchanged when logged count is within it", () => {
    expect(nextTargetSets(3, 2)).toBe(3);
  });

  it("raises the target to match when a set is logged at the target", () => {
    expect(nextTargetSets(3, 3)).toBe(3);
  });

  it("raises the target to match when a set is logged beyond the target", () => {
    expect(nextTargetSets(3, 4)).toBe(4);
  });
});
