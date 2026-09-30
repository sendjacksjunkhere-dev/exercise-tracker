import { describe, expect, it } from "vitest";
import { decideStartSession } from "./sessionDecision";

describe("decideStartSession", () => {
  it("creates normally when there's no existing unfinished session", () => {
    expect(decideStartSession(null)).toBe("create");
  });

  it("silently discards and creates when the existing session has no logged sets", () => {
    expect(decideStartSession({ hasLoggedSets: false })).toBe("discardAndCreate");
  });

  it("blocks when the existing session has logged sets", () => {
    expect(decideStartSession({ hasLoggedSets: true })).toBe("blocked");
  });
});
