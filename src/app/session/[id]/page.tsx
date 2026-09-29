import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";
import { getLastTime } from "@/lib/lastTimeQuery";
import { SessionScreen } from "./SessionScreen";

export default async function SessionPage(props: PageProps<"/session/[id]">) {
  const { id } = await props.params;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));

  if (!session) {
    return (
      <div className="p-6">
        <p>No session found for id {id}.</p>
      </div>
    );
  }

  const sessionExerciseRows = await db
    .select({
      sessionExerciseId: sessionExercises.id,
      exerciseId: sessionExercises.exerciseId,
      order: sessionExercises.order,
      targetSets: sessionExercises.targetSets,
      targetReps: sessionExercises.targetReps,
      exerciseName: exercises.name,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, id))
    .orderBy(sessionExercises.order);

  const setRows = await db
    .select({
      id: sets.id,
      exerciseId: sets.exerciseId,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(sets)
    .where(eq(sets.sessionId, id))
    .orderBy(sets.setNumber);

  const initialExercises = await Promise.all(
    sessionExerciseRows.map(async (row) => ({
      ...row,
      loggedSets: setRows
        .filter((s) => s.exerciseId === row.exerciseId)
        .map((s) => ({ id: s.id, setNumber: s.setNumber, reps: s.reps, weightKg: s.weightKg })),
      lastTime: await getLastTime(row.exerciseId, id),
    }))
  );

  return (
    <SessionScreen
      sessionId={session.id}
      planDay={session.planDay}
      initialExercises={initialExercises}
    />
  );
}
