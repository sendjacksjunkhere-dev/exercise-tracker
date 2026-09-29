import { describe, expect, it } from "vitest";
import { formatLogRows, isAlreadyPushed, type LogRowInput } from "./logRows";

function row(overrides: Partial<LogRowInput>): LogRowInput {
  return {
    sessionId: "2026-09-28-monday-a1b2",
    date: "2026-09-28",
    planDay: "Monday",
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
  it("maps a single set to the 8 expected columns", () => {
    const result = formatLogRows([row({})]);
    expect(result).toEqual([
      ["2026-09-28-monday-a1b2", "2026-09-28", "Monday", "Bench press", "1", "8", "60", ""],
    ]);
  });

  it("stringifies numbers and defaults missing notes to an empty string", () => {
    const result = formatLogRows([row({ setNumber: 2, reps: 7, weightKg: 62.5, notes: null })]);
    expect(result[0]).toEqual([
      "2026-09-28-monday-a1b2",
      "2026-09-28",
      "Monday",
      "Bench press",
      "2",
      "7",
      "62.5",
      "",
    ]);
  });

  it("passes through notes when present", () => {
    const result = formatLogRows([row({ notes: "felt heavy" })]);
    expect(result[0][7]).toBe("felt heavy");
  });

  it("sorts by exercise order, then set number, regardless of input order", () => {
    const rows = [
      row({ exerciseOrder: 2, exerciseName: "Cable row", setNumber: 1 }),
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 2 }),
      row({ exerciseOrder: 1, exerciseName: "Bench press", setNumber: 1 }),
    ];

    const result = formatLogRows(rows);

    expect(result.map((r) => [r[3], r[4]])).toEqual([
      ["Bench press", "1"],
      ["Bench press", "2"],
      ["Cable row", "1"],
    ]);
  });

  it("returns an empty array for no inputs", () => {
    expect(formatLogRows([])).toEqual([]);
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
