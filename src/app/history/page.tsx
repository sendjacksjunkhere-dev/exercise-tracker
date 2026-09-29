import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, sets } from "@/db/schema";

export default async function HistoryPage() {
  const rows = await db
    .select({
      id: sessions.id,
      date: sessions.date,
      planDay: sessions.planDay,
      finishedAt: sessions.finishedAt,
      setsDone: sql<number>`count(${sets.id})::int`,
    })
    .from(sessions)
    .leftJoin(sets, eq(sets.sessionId, sessions.id))
    .groupBy(sessions.id, sessions.date, sessions.planDay, sessions.finishedAt)
    .orderBy(desc(sessions.startedAt));

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">History</h1>

      {rows.length === 0 && (
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">No sessions yet.</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <a
              href={`/history/${row.id}`}
              className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900"
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {row.planDay} — {row.date}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {row.setsDone} sets{!row.finishedAt && " · in progress"}
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
