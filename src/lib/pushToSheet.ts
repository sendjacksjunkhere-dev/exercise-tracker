import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";
import { formatLogRows, isAlreadyPushed, type LogRowInput } from "./logRows";
import { appendLogRows, getExistingLogSessionIds } from "./sheetsLog";
import { markPushedToSheet } from "./session";

async function getLogRowInputs(sessionId: string): Promise<LogRowInput[]> {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const rows = await db
    .select({
      exerciseOrder: sessionExercises.order,
      exerciseName: exercises.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
      notes: sets.notes,
    })
    .from(sets)
    .innerJoin(
      sessionExercises,
      and(
        eq(sessionExercises.sessionId, sets.sessionId),
        eq(sessionExercises.exerciseId, sets.exerciseId)
      )
    )
    .innerJoin(exercises, eq(sets.exerciseId, exercises.id))
    .where(eq(sets.sessionId, sessionId));

  return rows.map((row) => ({
    sessionId: session.id,
    date: session.date,
    planDay: session.planDay,
    ...row,
  }));
}

export async function pushSessionToSheet(sessionId: string): Promise<boolean> {
  try {
    const existingIds = await getExistingLogSessionIds();
    if (isAlreadyPushed(existingIds, sessionId)) {
      await markPushedToSheet(sessionId);
      return true;
    }

    const rowInputs = await getLogRowInputs(sessionId);
    if (rowInputs.length > 0) {
      await appendLogRows(formatLogRows(rowInputs));
    }

    await markPushedToSheet(sessionId);
    return true;
  } catch (err) {
    console.error(`Failed to push session ${sessionId} to sheet:`, err);
    return false;
  }
}

export async function retryUnsyncedSessions(): Promise<void> {
  const unsynced = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(isNotNull(sessions.finishedAt), isNull(sessions.pushedToSheetAt)));

  for (const { id } of unsynced) {
    await pushSessionToSheet(id);
  }
}
