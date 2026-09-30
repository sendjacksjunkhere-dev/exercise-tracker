import Link from "next/link";
import { after } from "next/server";
import { getPlan } from "@/lib/plan";
import { WEEKDAYS } from "@/lib/planParser";
import { getUnfinishedSession } from "@/lib/session";
import { retryUnsyncedSessions } from "@/lib/pushToSheet";
import { buttonClass, cardClass } from "@/lib/ui";
import { DiscardSessionButton } from "@/components/DiscardSessionButton";
import { startSession } from "./actions";
import { StartSessionButton } from "./StartSessionButton";
import { DayPicker } from "./DayPicker";

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
  const unfinishedSession = await getUnfinishedSession();

  after(() => retryUnsyncedSessions());

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 px-6 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="text-3xl font-semibold text-text">Exercise Tracker</h1>
        <Link href="/history" className={buttonClass("outline", "sm")}>
          History
        </Link>
      </div>

      {unfinishedSession && (
        <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-card-current p-4">
          <Link href={`/session/${unfinishedSession.id}`} className="flex-1">
            <p className="font-medium text-accent">Resume session</p>
            <p className="text-sm text-text-muted">
              {unfinishedSession.planDay} · started{" "}
              {unfinishedSession.startedAt.toLocaleDateString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </Link>
          <DiscardSessionButton
            sessionId={unfinishedSession.id}
            label="Discard"
            className={buttonClass("dangerOutline", "sm")}
          />
        </div>
      )}

      <DayPicker selectedDay={selectedDay} />

      <main className="w-full max-w-md">
        {error && <p className="text-center text-red-400">{error}</p>}

        {!error && !planDay && (
          <p className="text-center text-text-muted">No exercises planned for {selectedDay}.</p>
        )}

        {!error && planDay && (
          <ul className="flex flex-col gap-4">
            {planDay.exercises.map((exercise) => (
              <li key={exercise.order} className={cardClass}>
                <p className="text-xl font-semibold text-text">{exercise.exercise}</p>
                <p className="text-lg text-text-muted">
                  {exercise.sets} × {exercise.reps}
                </p>
                {exercise.notes && (
                  <p className="mt-1 text-sm text-text-muted">{exercise.notes}</p>
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
