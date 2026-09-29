import { describe, expect, it } from "vitest";
import { durationMinutes, formatLogRows, isAlreadyPushed, type LogRowInput } from "./logRows";

const STARTED_AT = new Date("2026-07-15T04:30:00Z"); // 2026-07-15 14:30 Sydney (AEST)
const LAST_LOGGED_AT = new Date("2026-07-15T05:12:30Z"); // 42.5 min later

function row(overrides: Partial<LogRowInput>): LogRowInput {
  return {
    sessionId: "2026-07-15-monday-a1b2",
    date: "2026-07-15",
    planDay: "Monday",
    startedAt: STARTED_AT,
    lastLoggedAt: LAST_LOGGED_AT,
    exerciseOrder: 1,
    exerciseName: "Bench press",
    setNumber: 1,
    reps: 8,
    weightKg: 60,
    notes: null,
    ...overrides,
  };
}

describe("formatLogRows", () => {
  it("maps a single set to the 10 expected columns in order", () => {
    const result = formatLogRows([row({})]);
    expect(result).toEqual([
      [
        "2026-07-15-monday-a1b2",
        "2026-07-15",
        "Monday",
        "14:30",
        "43",
        "Bench press",
        "1",
        "8",
        "60",
        "",
      ],
    ]);
  });

  it("stringifies numbers and defaults missing notes to an empty string", () => {
    const result = formatLogRows([row({ setNumber: 2, reps: 7, weightKg: 62.5, notes: null })]);
    expect(result[0].slice(6)).toEqual(["2", "7", "62.5", ""]);
  });

  it("passes through notes when present", () => {
    const result = formatLogRows([row({ notes: "felt heavy" })]);
    expect(result[0][9]).toBe("felt heavy");
  });

  it("repeats start time and duration identically across every row of the session", () => {
    const rows = [
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 1 }),
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 2 }),
      row({ exerciseOrder: 2, exerciseName: "Cable row", setNumber: 1 }),
    ];

    const result = formatLogRows(rows);

    expect(result.map((r) => [r[3], r[4]])).toEqual([
      ["14:30", "43"],
      ["14:30", "43"],
      ["14:30", "43"],
    ]);
  });

  it("sorts by exercise order, then set number, regardless of input order", () => {
    const rows = [
      row({ exerciseOrder: 2, exerciseName: "Cable row", setNumber: 1 }),
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 2 }),
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 1 }),
    ];

    const result = formatLogRows(rows);

    expect(result.map((r) => [r[5], r[6]])).toEqual([
      ["Bench press", "1"],
      ["Bench press", "2"],
      ["Cable row", "1"],
    ]);
  });

  it("returns an empty array for no inputs", () => {
    expect(formatLogRows([])).toEqual([]);
  });
});

describe("durationMinutes", () => {
  it("rounds to the nearest minute", () => {
    expect(durationMinutes(new Date("2026-07-15T04:30:00Z"), new Date("2026-07-15T05:12:30Z"))).toBe(
      43
    );
    expect(durationMinutes(new Date("2026-07-15T04:30:00Z"), new Date("2026-07-15T05:12:29Z"))).toBe(
      42
    );
  });

  it("is zero when start and end are the same instant", () => {
    const t = new Date("2026-07-15T04:30:00Z");
    expect(durationMinutes(t, t)).toBe(0);
  });
});

describe("isAlreadyPushed", () => {
  it("returns true when the session id is present", () => {
    expect(isAlreadyPushed(["a", "2026-09-28-monday-a1b2", "b"], "2026-09-28-monday-a1b2")).toBe(
      true
    );
  });

  it("returns false when the session id is absent", () => {
    expect(isAlreadyPushed(["a", "b"], "2026-09-28-monday-a1b2")).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(isAlreadyPushed([], "2026-09-28-monday-a1b2")).toBe(false);
  });
});
