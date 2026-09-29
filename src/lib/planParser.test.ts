import { describe, expect, it } from "vitest";
import { parsePlanRows } from "./planParser";

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
});
