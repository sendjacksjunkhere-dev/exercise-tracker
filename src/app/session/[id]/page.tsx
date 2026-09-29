import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { exercises, sessionExercises, sessions } from "@/db/schema";

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

  const rows = await db
    .select({
      order: sessionExercises.order,
      targetSets: sessionExercises.targetSets,
      targetReps: sessionExercises.targetReps,
      exerciseName: exercises.name,
    })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, id))
    .orderBy(sessionExercises.order);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        {session.planDay} session — {session.id}
      </h1>
      <p className="text-sm text-zinc-500">Started {session.startedAt.toString()}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.order}>
            {row.order}. {row.exerciseName} — {row.targetSets} × {row.targetReps}
          </li>
        ))}
      </ul>
    </div>
  );
}
