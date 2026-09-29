"use server";

import * as setsLib from "@/lib/sets";

export async function logSetAction(
  sessionId: string,
  exerciseId: number,
  reps: number,
  weightKg: number
) {
  return setsLib.logSet({ sessionId, exerciseId, reps, weightKg });
}

export async function updateSetAction(setId: number, reps: number, weightKg: number) {
  await setsLib.updateSet(setId, reps, weightKg);
}

export async function deleteSetAction(setId: number) {
  await setsLib.deleteSet(setId);
}

export async function updateTargetSetsAction(sessionExerciseId: number, newTarget: number) {
  return setsLib.updateTargetSets(sessionExerciseId, newTarget);
}
