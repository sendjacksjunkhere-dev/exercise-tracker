import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";

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

      <ul className="mt-4 flex flex-col gap-4">
        {sessionExerciseRows.map((exercise) => {
          const exerciseSets = setRows.filter((s) => s.exerciseId === exercise.exerciseId);
          return (
            <li key={exercise.exerciseId} className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900">
              <p className="text-lg font-semibold text-black dark:text-zinc-50">
                {exercise.exerciseName}
              </p>
              {exerciseSets.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No sets logged</p>
              ) : (
                <ul className="mt-1 flex flex-col gap-1">
                  {exerciseSets.map((set) => (
                    <li key={set.setNumber} className="text-zinc-700 dark:text-zinc-300">
                      Set {set.setNumber}: {set.weightKg} kg × {set.reps}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
