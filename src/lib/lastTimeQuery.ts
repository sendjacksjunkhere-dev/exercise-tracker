import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, sets } from "@/db/schema";
import { pickLastTime, type LastTime } from "./lastTime";

export async function getLastTime(
  exerciseId: number,
  currentSessionId: string
): Promise<LastTime | null> {
  const rows = await db
    .select({
      sessionId: sets.sessionId,
      sessionDate: sessions.date,
      sessionStartedAt: sessions.startedAt,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(sets)
    .innerJoin(sessions, eq(sets.sessionId, sessions.id))
    .where(eq(sets.exerciseId, exerciseId));

  return pickLastTime(rows, currentSessionId);
}
