import { describe, expect, it } from "vitest";
import { formatLastTime, formatShortDate, pickLastTime, type LastTimeSetRow } from "./lastTime";

function row(overrides: Partial<LastTimeSetRow>): LastTimeSetRow {
  return {
    sessionId: "session-a",
    sessionDate: "2026-09-22",
    sessionStartedAt: new Date("2026-09-22T10:00:00Z"),
    setNumber: 1,
    reps: 8,
    weightKg: 60,
    ...overrides,
  };
}

describe("pickLastTime", () => {
  it("returns null when there are no other sessions", () => {
    const rows = [row({ sessionId: "current" })];
    expect(pickLastTime(rows, "current")).toBeNull();
  });

  it("excludes the current session even if it has sets", () => {
    const rows = [
      row({ sessionId: "current", sessionStartedAt: new Date("2026-09-29T10:00:00Z") }),
      row({ sessionId: "previous", sessionStartedAt: new Date("2026-09-22T10:00:00Z") }),
    ];
    const result = pickLastTime(rows, "current");
    expect(result?.date).toBe("2026-09-22");
  });

  it("picks the most recent session by startedAt, not just date", () => {
    const rows = [
      row({
        sessionId: "older",
        sessionDate: "2026-09-20",
        sessionStartedAt: new Date("2026-09-20T08:00:00Z"),
        reps: 5,
      }),
      row({
        sessionId: "newer",
        sessionDate: "2026-09-22",
        sessionStartedAt: new Date("2026-09-22T18:00:00Z"),
        reps: 9,
      }),
    ];
    const result = pickLastTime(rows, "current");
    expect(result).toEqual({ date: "2026-09-22", sets: [{ setNumber: 1, reps: 9, weightKg: 60 }] });
  });

  it("returns all sets of the picked session ordered by set number", () => {
    const rows = [
      row({ sessionId: "previous", setNumber: 2, reps: 7 }),
      row({ sessionId: "previous", setNumber: 1, reps: 8 }),
      row({ sessionId: "previous", setNumber: 3, reps: 6 }),
    ];
    const result = pickLastTime(rows, "current");
    expect(result?.sets.map((s) => s.setNumber)).toEqual([1, 2, 3]);
    expect(result?.sets.map((s) => s.reps)).toEqual([8, 7, 6]);
  });
});

describe("formatLastTime", () => {
  it("formats a single shared weight as one prefix", () => {
    const result = formatLastTime({
      date: "2026-09-22",
      sets: [
        { setNumber: 1, reps: 8, weightKg: 60 },
        { setNumber: 2, reps: 8, weightKg: 60 },
        { setNumber: 3, reps: 7, weightKg: 60 },
      ],
    });
    expect(result).toBe("60 kg × 8, 8, 7");
  });

  it("formats per-set when weights differ", () => {
    const result = formatLastTime({
      date: "2026-09-22",
      sets: [
        { setNumber: 1, reps: 8, weightKg: 60 },
        { setNumber: 2, reps: 7, weightKg: 62.5 },
      ],
    });
    expect(result).toBe("60 kg × 8, 62.5 kg × 7");
  });
});

describe("formatShortDate", () => {
  it("formats a date string as weekday, day, short month", () => {
    expect(formatShortDate("2026-09-29")).toBe("Tue 29 Sep");
  });

  it("doesn't shift the date regardless of the runner's local timezone", () => {
    expect(formatShortDate("2026-01-01")).toBe("Thu 1 Jan");
    expect(formatShortDate("2026-12-31")).toBe("Thu 31 Dec");
  });
});
