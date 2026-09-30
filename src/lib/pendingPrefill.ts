import type { LastTime } from "./lastTime";

export type LoggedSetLike = { setNumber: number; reps: number; weightKg: number };

export type PrefillExercise = {
  targetReps: number | null;
  targetWeightKg: number | null;
  loggedSets: LoggedSetLike[];
  lastTime: LastTime | null;
};

export type Pending = { reps: number; weightKg: number };

export const DEFAULT_WEIGHT_KG = 20;

export function computePending(exercise: PrefillExercise, setNumber: number): Pending {
  const lastTimeSet = exercise.lastTime?.sets.find((s) => s.setNumber === setNumber);
  if (lastTimeSet) {
    return { reps: lastTimeSet.reps, weightKg: lastTimeSet.weightKg };
  }

  const previousSetThisSession = exercise.loggedSets.find((s) => s.setNumber === setNumber - 1);
  if (previousSetThisSession) {
    return { reps: previousSetThisSession.reps, weightKg: previousSetThisSession.weightKg };
  }

  return {
    reps: exercise.targetReps ?? 0,
    weightKg: exercise.targetWeightKg ?? DEFAULT_WEIGHT_KG,
  };
}
