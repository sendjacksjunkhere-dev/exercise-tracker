import { describe, expect, it } from "vitest";
import { formatSydneyDate, formatSydneyTime } from "./timezone";

describe("formatSydneyDate", () => {
  it("formats a winter (AEST, UTC+10) instant as the correct Sydney date", () => {
    // 2026-07-15T04:30:00Z + 10h = 2026-07-15 14:30 Sydney
    expect(formatSydneyDate(new Date("2026-07-15T04:30:00Z"))).toBe("2026-07-15");
  });

  it("formats a summer (AEDT, UTC+11) instant as the correct Sydney date", () => {
    // 2026-01-15T04:30:00Z + 11h = 2026-01-15 15:30 Sydney
    expect(formatSydneyDate(new Date("2026-01-15T04:30:00Z"))).toBe("2026-01-15");
  });

  it("rolls over to the next Sydney date when UTC is still on the previous day", () => {
    // 2026-07-15T15:00:00Z + 10h = 2026-07-16 01:00 Sydney
    expect(formatSydneyDate(new Date("2026-07-15T15:00:00Z"))).toBe("2026-07-16");
  });
});

describe("formatSydneyTime", () => {
  it("formats a winter (AEST, UTC+10) instant as HH:MM", () => {
    expect(formatSydneyTime(new Date("2026-07-15T04:30:00Z"))).toBe("14:30");
  });

  it("formats a summer (AEDT, UTC+11) instant as HH:MM", () => {
    expect(formatSydneyTime(new Date("2026-01-15T04:30:00Z"))).toBe("15:30");
  });
});
