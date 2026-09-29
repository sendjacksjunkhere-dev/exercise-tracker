"use server";

import { redirect } from "next/navigation";
import * as setsLib from "@/lib/sets";
import { finishSession } from "@/lib/session";
import { pushSessionToSheet } from "@/lib/pushToSheet";

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

export async function saveSessionAction(sessionId: string) {
  await finishSession(sessionId);
  await pushSessionToSheet(sessionId);
  redirect("/");
}
