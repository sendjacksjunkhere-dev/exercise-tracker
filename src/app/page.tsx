import Link from "next/link";
import { getPlan } from "@/lib/plan";
import { WEEKDAYS } from "@/lib/planParser";
import { startSession } from "./actions";
import { StartSessionButton } from "./StartSessionButton";

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const requestedDay = searchParams.day;
  const selectedDay =
    typeof requestedDay === "string" && WEEKDAYS.includes(requestedDay as (typeof WEEKDAYS)[number])
      ? requestedDay
      : today;

  let plan;
  let error: string | null = null;
  try {
    plan = await getPlan();
  } catch (err) {
    console.error("Failed to load plan:", err);
    error = "Couldn't load the plan from Google Sheets. Try again shortly.";
  }

  const planDay = plan?.find((day) => day.day === selectedDay);

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
          Exercise Tracker
        </h1>
        <Link
          href="/history"
          className="text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
        >
          History
        </Link>
      </div>

      <nav className="flex w-full max-w-md flex-wrap justify-center gap-2">
        {WEEKDAYS.map((day) => (
          <a
            key={day}
            href={`/?day=${day}`}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              day === selectedDay
                ? "bg-black text-white dark:bg-white dark:text-black"
                : "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
            }`}
          >
            {day}
          </a>
        ))}
      </nav>

      <main className="w-full max-w-md">
        {error && <p className="text-center text-red-600 dark:text-red-400">{error}</p>}

        {!error && !planDay && (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No exercises planned for {selectedDay}.
          </p>
        )}

        {!error && planDay && (
          <ul className="flex flex-col gap-4">
            {planDay.exercises.map((exercise) => (
              <li
                key={exercise.order}
                className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900"
              >
                <p className="text-xl font-semibold text-black dark:text-zinc-50">
                  {exercise.exercise}
                </p>
                <p className="text-lg text-zinc-700 dark:text-zinc-300">
                  {exercise.sets} × {exercise.reps}
                </p>
                {exercise.notes && (
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {exercise.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {!error && planDay && (
          <form action={startSession} className="mt-6">
            <input type="hidden" name="day" value={selectedDay} />
            <StartSessionButton />
          </form>
        )}
      </main>
    </div>
  );
}
