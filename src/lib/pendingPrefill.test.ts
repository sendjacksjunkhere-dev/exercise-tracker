import { describe, expect, it } from "vitest";
import { computePending, DEFAULT_WEIGHT_KG, type PrefillExercise } from "./pendingPrefill";

function exercise(overrides: Partial<PrefillExercise> = {}): PrefillExercise {
  return {
    targetReps: 8,
    targetWeightKg: null,
    loggedSets: [],
    lastTime: null,
    ...overrides,
  };
}

describe("computePending", () => {
  it("prefers last time's set N when it exists", () => {
    const result = computePending(
      exercise({
        targetWeightKg: 60,
        lastTime: { date: "2026-09-23", sets: [{ setNumber: 1, reps: 10, weightKg: 55 }] },
        loggedSets: [{ setNumber: 0, reps: 99, weightKg: 99 }],
      }),
      1
    );
    expect(result).toEqual({ reps: 10, weightKg: 55 });
  });

  it("falls back to the previous set this session when there's no last-time set N", () => {
    const result = computePending(
      exercise({
        targetWeightKg: 60,
        lastTime: { date: "2026-09-23", sets: [{ setNumber: 1, reps: 10, weightKg: 55 }] },
        loggedSets: [{ setNumber: 1, reps: 12, weightKg: 57.5 }],
      }),
      2
    );
    expect(result).toEqual({ reps: 12, weightKg: 57.5 });
  });

  it("falls back to the plan target weight when there's no last-time or in-session set", () => {
    const result = computePending(exercise({ targetReps: 8, targetWeightKg: 60 }), 1);
    expect(result).toEqual({ reps: 8, weightKg: 60 });
  });

  it("falls back to 20kg when there's no last time, in-session set, or plan weight", () => {
    const result = computePending(exercise({ targetReps: 8, targetWeightKg: null }), 1);
    expect(result).toEqual({ reps: 8, weightKg: DEFAULT_WEIGHT_KG });
  });

  it("falls back to 0 reps when there's no plan target reps either", () => {
    const result = computePending(exercise({ targetReps: null, targetWeightKg: null }), 1);
    expect(result).toEqual({ reps: 0, weightKg: DEFAULT_WEIGHT_KG });
  });
});
