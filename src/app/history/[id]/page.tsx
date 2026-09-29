import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";
import { SessionExerciseSummary } from "@/components/SessionExerciseSummary";

export default async function HistoryDetailPage(props: PageProps<"/history/[id]">) {
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
      exerciseId: sessionExercises.exerciseId,
      order: sessionExercises.order,
      exerciseName: exercises.name,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, id))
    .orderBy(sessionExercises.order);

  const setRows = await db
    .select({
      exerciseId: sets.exerciseId,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(sets)
    .where(eq(sets.sessionId, id))
    .orderBy(sets.setNumber);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        {session.planDay} — {session.date}
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {session.finishedAt ? "Finished" : "In progress"}
      </p>

      <SessionExerciseSummary exercises={sessionExerciseRows} sets={setRows} />
    </div>
  );
}
