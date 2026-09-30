import { describe, expect, it } from "vitest";
import { getPlanWarnings, parsePlanRows } from "./planParser";

const HEADER = ["Day", "Order", "Exercise", "Sets", "Reps", "Notes", "Video URL"];
const HEADER_WITH_WEIGHT = [
  "Day",
  "Order",
  "Exercise",
  "Sets",
  "Reps",
  "Weight (kg)",
  "Notes",
  "Video URL",
];

describe("parsePlanRows", () => {
  it("groups rows by day and sorts exercises by order", () => {
    const rows = [
      HEADER,
      ["Monday", "2", "Squat", "3", "5", "", ""],
      ["Monday", "1", "Bench press", "3", "8", "Pause at chest", ""],
      ["Tuesday", "1", "Deadlift", "1", "5", "", ""],
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
            weightKg: null,
            notes: "Pause at chest",
          },
          { order: 2, exercise: "Squat", sets: 3, reps: 5, weightKg: null },
        ],
      },
      {
        day: "Tuesday",
        exercises: [{ order: 1, exercise: "Deadlift", sets: 1, reps: 5, weightKg: null }],
      },
    ]);
  });

  it("skips rows with a blank day or exercise", () => {
    const rows = [
      HEADER,
      ["Monday", "1", "Bench press", "3", "8", "", ""],
      ["", "2", "Squat", "3", "5", "", ""],
      ["Monday", "3", "", "3", "5", "", ""],
      ["   ", "4", "Row", "3", "10", "", ""],
    ];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [{ order: 1, exercise: "Bench press", sets: 3, reps: 8, weightKg: null }],
      },
    ]);
  });

  it("trims whitespace and omits empty notes/videoUrl", () => {
    const rows = [HEADER, ["  Monday  ", "1", "  Bench press  ", "3", "8", "  ", "  "]];

    const result = parsePlanRows(rows);

    expect(result).toEqual([
      {
        day: "Monday",
        exercises: [{ order: 1, exercise: "Bench press", sets: 3, reps: 8, weightKg: null }],
      },
    ]);
  });

  it("includes notes and videoUrl when present", () => {
    const rows = [
      HEADER,
      ["Monday", "1", "Bench press", "3", "8", "Pause at chest", "https://example.com/bench"],
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
            weightKg: null,
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

  it("returns an empty array when only a header row is present", () => {
    expect(parsePlanRows([HEADER])).toEqual([]);
  });

  it("defaults a blank Sets cell to 1", () => {
    const rows = [HEADER, ["Monday", "1", "Bench press", "", "8", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].sets).toBe(1);
  });

  it("leaves Reps as null when the cell is blank", () => {
    const rows = [HEADER, ["Monday", "1", "Bench press", "3", "", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].reps).toBeNull();
  });

  it("leaves Reps as null when the row is truncated before that column", () => {
    const rows = [HEADER, ["Monday", "1", "Bench press", "3"]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0]).toEqual({
      order: 1,
      exercise: "Bench press",
      sets: 3,
      reps: null,
      weightKg: null,
    });
  });

  it("parses a numeric Weight (kg) cell", () => {
    const rows = [HEADER_WITH_WEIGHT, ["Monday", "1", "Bench press", "3", "8", "60", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].weightKg).toBe(60);
  });

  it("leaves weightKg as null when the Weight (kg) cell is blank", () => {
    const rows = [HEADER_WITH_WEIGHT, ["Monday", "1", "Bench press", "3", "8", "", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].weightKg).toBeNull();
  });

  it("leaves weightKg as null when the Weight (kg) column doesn't exist yet", () => {
    const rows = [HEADER, ["Monday", "1", "Bench press", "3", "8", "", ""]];
    const result = parsePlanRows(rows);
    expect(result[0].exercises[0].weightKg).toBeNull();
  });

  it("parses correctly when columns are reordered in the header", () => {
    const reorderedHeader = [
      "Weight (kg)",
      "Video URL",
      "Order",
      "Notes",
      "Exercise",
      "Day",
      "Reps",
      "Sets",
    ];
    // Same column order as reorderedHeader above.
    const rows = [
      reorderedHeader,
      ["60", "", "1", "Pause at chest", "Bench press", "Monday", "8", "3"],
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
            weightKg: 60,
            notes: "Pause at chest",
          },
        ],
      },
    ]);
  });
});

describe("getPlanWarnings", () => {
  it("warns about a row with a day but no exercise name", () => {
    const rows = [HEADER, ["Monday", "3", "", "3", "5", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([
      "Skipped a row for Monday (order 3): missing exercise name.",
    ]);
  });

  it("stays silent for an ordinary blank row (day and exercise both empty)", () => {
    const rows = [HEADER, ["", "", "", "", "", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([]);
  });

  it("stays silent for well-formed rows", () => {
    const rows = [HEADER, ["Monday", "1", "Bench press", "3", "8", "", ""]];
    expect(getPlanWarnings(rows)).toEqual([]);
  });

  it("returns an empty array when only a header row is present", () => {
    expect(getPlanWarnings([HEADER])).toEqual([]);
  });
});
