import { describe, expect, it } from "vitest";
import { getPlanWarnings, parsePlanRows } from "./planParser";

describe("parsePlanRows", () => {
  it("groups rows by day and sorts exercises by order", () => {
    const rows = [
      ["Monday", "2", "Squat", "3", "5", "", ""],
      ["Monday", "1", "Bench press", "3", "8", "Pause at chest", ""],
      ["Tuesday", "1", "Deadlift", "1", "5", "", ""],
    ];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [
          { order: 1, exercise: "Bench press", sets: 3, reps: 8, notes: "Pause at chest" },
          { order: 2, exercise: "Squat", sets: 3, reps: 5 },
        ],
      },
      {
        day: "Tuesday",
        exercises: [{ order: 1, exercise: "Deadlift", sets: 1, reps: 5 }],
      },
    ]);
  });

  it("skips rows with a blank day or exercise", () => {
    const rows = [
      ["Monday", "1", "Bench press", "3", "8", "", ""],
      ["", "2", "Squat", "3", "5", "", ""],
      ["Monday", "3", "", "3", "5", "", ""],
      ["   ", "4", "Row", "3", "10", "", ""],
    ];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [{ order: 1, exercise: "Bench press", sets: 3, reps: 8 }],
      },
    ]);
  });

  it("trims whitespace and omits empty notes/videoUrl", () => {
    const rows = [["  Monday  ", "1", "  Bench press  ", "3", "8", "  ", "  "]];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [{ order: 1, exercise: "Bench press", sets: 3, reps: 8 }],
      },
    ]);
  });

  it("includes notes and videoUrl when present", () => {
    const rows = [
      [
        "Monday",
        "1",
        "Bench press",
        "3",
        "8",
        "Pause at chest",
        "https://example.com/bench",
      ],
    ];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [
          {
            order: 1,
            exercise: "Bench press",
            sets: 3,
            reps: 8,
            notes: "Pause at chest",
            videoUrl: "https://example.com/bench",
          },
        ],
      },
    ]);
  });

  it("returns an empty array for no rows", () => {
    expect(parsePlanRows([])).toEqual([]);
  });

  it("defaults a blank Sets cell to 1", () => {
    const rows = [["Monday", "1", "Bench press", "", "8", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].sets).toBe(1);
  });

  it("leaves Reps as null when the cell is blank", () => {
    const rows = [["Monday", "1", "Bench press", "3", "", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].reps).toBeNull();
  });

  it("leaves Reps as null when the row is truncated before that column", () => {
    const rows = [["Monday", "1", "Bench press", "3"]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0]).toEqual({
      order: 1,
      exercise: "Bench press",
      sets: 3,
      reps: null,
    });
  });
});

describe("getPlanWarnings", () => {
  it("warns about a row with a day but no exercise name", () => {
    const rows = [["Monday", "3", "", "3", "5", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([
      "Skipped a row for Monday (order 3): missing exercise name.",
    ]);
  });

  it("stays silent for an ordinary blank row (day and exercise both empty)", () => {
    const rows = [["", "", "", "", "", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([]);
  });

  it("stays silent for well-formed rows", () => {
    const rows = [["Monday", "1", "Bench press", "3", "8", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([]);
  });
});
