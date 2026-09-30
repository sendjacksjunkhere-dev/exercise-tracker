import { desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";
import { getPlan } from "./plan";
import { formatSydneyDate } from "./timezone";
import { decideStartSession } from "./sessionDecision";

export { decideStartSession, type StartSessionDecision } from "./sessionDecision";

export function generateSessionId(date: Date, planDay: string): string {
  const dateStr = formatSydneyDate(date);
  const daySlug = planDay.toLowerCase();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4);
  return `${dateStr}-${daySlug}-${suffix}`;
}

async function resolveExerciseIds(names: string[]): Promise<Map<string, number>> {
  const uniqueNames = [...new Set(names)];
  const lowerNames = uniqueNames.map((name) => name.toLowerCase());

  const existing = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(inArray(sql`lower(${exercises.name})`, lowerNames));

  const idByLowerName = new Map(existing.map((row) => [row.name.toLowerCase(), row.id]));

  const missingNames = uniqueNames.filter((name) => !idByLowerName.has(name.toLowerCase()));

  if (missingNames.length > 0) {
    const inserted = await db
      .insert(exercises)
      .values(missingNames.map((name) => ({ name })))
      .returning({ id: exercises.id, name: exercises.name });

    for (const row of inserted) {
      idByLowerName.set(row.name.toLowerCase(), row.id);
    }
  }

  return idByLowerName;
}

export async function startSession(planDay: string): Promise<string> {
  const plan = await getPlan();
  const day = plan.find((d) => d.day === planDay);

  if (!day || day.exercises.length === 0) {
    throw new Error(`No plan exercises for ${planDay}`);
  }

  const existing = await getUnfinishedSession();
  const decision = decideStartSession(existing);

  if (decision === "blocked") {
    throw new Error("An unfinished session with logged sets already exists");
  }
  if (decision === "discardAndCreate" && existing) {
    await deleteSession(existing.id);
  }

  const idByLowerName = await resolveExerciseIds(day.exercises.map((e) => e.exercise));
  const sessionId = generateSessionId(new Date(), planDay);

  await db.batch([
    db.insert(sessions).values({
      id: sessionId,
      date: sessionId.slice(0, 10),
      planDay,
    }),
    db.insert(sessionExercises).values(
      day.exercises.map((exercise) => ({
        sessionId,
        exerciseId: idByLowerName.get(exercise.exercise.toLowerCase())!,
        order: exercise.order,
        targetSets: exercise.sets,
        targetReps: exercise.reps,
      }))
    ),
  ]);

  return sessionId;
}

export async function finishSession(sessionId: string): Promise<void> {
  await db.update(sessions).set({ finishedAt: new Date() }).where(eq(sessions.id, sessionId));
}

export async function markPushedToSheet(sessionId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ pushedToSheetAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.delete(sets).where(eq(sets.sessionId, sessionId));
  await db.delete(sessionExercises).where(eq(sessionExercises.sessionId, sessionId));
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function getUnfinishedSession(): Promise<{
  id: string;
  planDay: string;
  startedAt: Date;
  hasLoggedSets: boolean;
} | null> {
  const [row] = await db
    .select({
      id: sessions.id,
      planDay: sessions.planDay,
      startedAt: sessions.startedAt,
      setCount: sql<number>`(select count(*) from sets where sets.session_id = sessions.id)::int`,
    })
    .from(sessions)
    .where(isNull(sessions.finishedAt))
    .orderBy(desc(sessions.startedAt))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    planDay: row.planDay,
    startedAt: row.startedAt,
    hasLoggedSets: row.setCount > 0,
  };
}
