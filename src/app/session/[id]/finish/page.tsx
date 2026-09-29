import { eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions, sets } from "@/db/schema";
import { SessionExerciseSummary } from "@/components/SessionExerciseSummary";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { saveSessionAction } from "../actions";

export default async function FinishSessionPage(props: PageProps<"/session/[id]/finish">) {
  const { id } = await props.params;

  const [session] = await db.select().from(sessions).where(eq(sessions.id, id));

  if (!session) {
    return (
      <div className="p-6">
        <p>No session found for id {id}.</p>
      </div>
    );
  }

  if (session.finishedAt) {
    redirect(`/history/${id}`);
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

  const emptyExercises = sessionExerciseRows.filter(
    (exercise) => !setRows.some((s) => s.exerciseId === exercise.exerciseId)
  );

  const saveWithId = saveSessionAction.bind(null, id);

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
        {session.planDay} session summary
      </h1>

      {emptyExercises.length > 0 && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-500">
          {emptyExercises.length} exercise{emptyExercises.length > 1 ? "s" : ""} with no
          sets logged: {emptyExercises.map((e) => e.exerciseName).join(", ")}
        </p>
      )}

      <SessionExerciseSummary exercises={sessionExerciseRows} sets={setRows} />

      <div className="mt-6 flex flex-col gap-3">
        <form action={saveWithId}>
          <button
            type="submit"
            className="h-14 w-full rounded-lg bg-black text-lg font-medium text-white dark:bg-white dark:text-black"
          >
            Save session
          </button>
        </form>

        <Link
          href={`/session/${id}`}
          className="flex h-14 w-full items-center justify-center rounded-lg bg-zinc-200 text-lg font-medium text-black dark:bg-zinc-800 dark:text-zinc-50"
        >
          Back to workout
        </Link>

        <DiscardSessionButton
          sessionId={id}
          className="flex h-14 w-full items-center justify-center rounded-lg border border-red-300 text-lg font-medium text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-400"
        />
      </div>
    </div>
  );
}
