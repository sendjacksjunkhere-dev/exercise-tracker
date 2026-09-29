import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions } from "@/db/schema";
import { getPlan } from "./plan";

export function generateSessionId(date: Date, planDay: string): string {
  const dateStr = date.toISOString().slice(0, 10);
  const daySlug = planDay.toLowerCase();
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4);
  return `${dateStr}-${daySlug}-${suffix}`;
}

async function getOrCreateExercise(name: string): Promise<number> {
  const existing = await db
    .select({ id: exercises.id })
    .from(exercises)
    .where(sql`lower(${exercises.name}) = lower(${name})`)
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const inserted = await db
    .insert(exercises)
    .values({ name })
    .returning({ id: exercises.id });

  return inserted[0].id;
}

export async function startSession(planDay: string): Promise<string> {
  const plan = await getPlan();
  const day = plan.find((d) => d.day === planDay);

  if (!day || day.exercises.length === 0) {
    throw new Error(`No plan exercises for ${planDay}`);
  }

  const sessionId = generateSessionId(new Date(), planDay);

  await db.insert(sessions).values({
    id: sessionId,
    date: sessionId.slice(0, 10),
    planDay,
  });

  for (const exercise of day.exercises) {
    const exerciseId = await getOrCreateExercise(exercise.exercise);
    await db.insert(sessionExercises).values({
      sessionId,
      exerciseId,
      order: exercise.order,
      targetSets: exercise.sets,
      targetReps: exercise.reps,
    });
  }

  return sessionId;
}
