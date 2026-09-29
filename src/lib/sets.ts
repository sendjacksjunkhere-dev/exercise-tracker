import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sessionExercises, sets } from "@/db/schema";

export type LoggedSet = {
  id: number;
  setNumber: number;
  reps: number;
  weightKg: number;
};

async function countLoggedSets(sessionId: string, exerciseId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sets)
    .where(and(eq(sets.sessionId, sessionId), eq(sets.exerciseId, exerciseId)));

  return row.count;
}

export async function logSet(params: {
  sessionId: string;
  exerciseId: number;
  reps: number;
  weightKg: number;
}): Promise<LoggedSet> {
  const loggedCount = await countLoggedSets(params.sessionId, params.exerciseId);

  const [row] = await db
    .insert(sets)
    .values({
      sessionId: params.sessionId,
      exerciseId: params.exerciseId,
      setNumber: loggedCount + 1,
      reps: params.reps,
      weightKg: params.weightKg,
    })
    .returning({ id: sets.id, setNumber: sets.setNumber, reps: sets.reps, weightKg: sets.weightKg });

  return row;
}

export async function updateSet(setId: number, reps: number, weightKg: number): Promise<void> {
  await db.update(sets).set({ reps, weightKg }).where(eq(sets.id, setId));
}

export async function deleteSet(setId: number): Promise<void> {
  await db.delete(sets).where(eq(sets.id, setId));
}

export async function updateTargetSets(
  sessionExerciseId: number,
  newTarget: number
): Promise<number> {
  const [sessionExercise] = await db
    .select({ sessionId: sessionExercises.sessionId, exerciseId: sessionExercises.exerciseId })
    .from(sessionExercises)
    .where(eq(sessionExercises.id, sessionExerciseId));

  if (!sessionExercise) {
    throw new Error(`session_exercise ${sessionExerciseId} not found`);
  }

  const loggedCount = await countLoggedSets(sessionExercise.sessionId, sessionExercise.exerciseId);
  const clamped = Math.max(newTarget, loggedCount);

  await db
    .update(sessionExercises)
    .set({ targetSets: clamped })
    .where(eq(sessionExercises.id, sessionExerciseId));

  return clamped;
}
