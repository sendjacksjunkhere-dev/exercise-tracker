"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { formatShortDate, type LastTime } from "@/lib/lastTime";
import { buttonClass, cardClass } from "@/lib/ui";
import {
  deleteSetAction,
  logSetAction,
  updateSetAction,
  updateTargetSetsAction,
} from "./actions";

type LoggedSet = {
  id: number;
  setNumber: number;
  reps: number;
  weightKg: number;
};

type ExerciseVM = {
  sessionExerciseId: number;
  exerciseId: number;
  order: number;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  loggedSets: LoggedSet[];
  lastTime: LastTime | null;
};

type Pending = { reps: number; weightKg: number };
type ExerciseState = "done" | "current" | "started" | "empty";

const DEFAULT_WEIGHT_KG = 20;

function computePending(exercise: ExerciseVM, setNumber: number): Pending {
  const lastTimeSet = exercise.lastTime?.sets.find((s) => s.setNumber === setNumber);
  if (lastTimeSet) {
    return { reps: lastTimeSet.reps, weightKg: lastTimeSet.weightKg };
  }

  const previousSetThisSession = exercise.loggedSets.find((s) => s.setNumber === setNumber - 1);
  if (previousSetThisSession) {
    return { reps: previousSetThisSession.reps, weightKg: previousSetThisSession.weightKg };
  }

  return { reps: exercise.targetReps, weightKg: DEFAULT_WEIGHT_KG };
}

const LONG_NAME_THRESHOLD = 16;

function exerciseTitleClass(name: string): string {
  return name.length > LONG_NAME_THRESHOLD ? "text-xl" : "text-3xl";
}

function stateFor(exercise: ExerciseVM, currentExerciseId: number): ExerciseState {
  if (exercise.loggedSets.length >= exercise.targetSets) return "done";
  if (exercise.exerciseId === currentExerciseId) return "current";
  if (exercise.loggedSets.length > 0) return "started";
  return "empty";
}

function StateIndicator({ state }: { state: ExerciseState }) {
  if (state === "done") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-done">
        <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-bg stroke-2">
          <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="h-8 w-8 shrink-0 rounded-full border-2 border-accent" aria-hidden />
    );
  }

  if (state === "started") {
    return <span className="h-8 w-8 shrink-0 rounded-full bg-accent" aria-hidden />;
  }

  return (
    <span className="h-8 w-8 shrink-0 rounded-full border-2 border-border" aria-hidden />
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-none stroke-text-muted stroke-2">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5V10L13 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SessionScreen({
  sessionId,
  planDay,
  initialExercises,
}: {
  sessionId: string;
  planDay: string;
  initialExercises: ExerciseVM[];
}) {
  const [exerciseList, setExerciseList] = useState<ExerciseVM[]>(initialExercises);
  const [currentExerciseId, setCurrentExerciseId] = useState<number>(() => {
    const firstIncomplete = initialExercises.find((e) => e.loggedSets.length < e.targetSets);
    return (firstIncomplete ?? initialExercises[0]).exerciseId;
  });
  const [pendingByExercise, setPendingByExercise] = useState<Record<number, Pending>>(() => {
    const map: Record<number, Pending> = {};
    for (const exercise of initialExercises) {
      map[exercise.exerciseId] = computePending(exercise, exercise.loggedSets.length + 1);
    }
    return map;
  });
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Pending>({ reps: 0, weightKg: 0 });
  const [isPending, startTransition] = useTransition();
  const logSetGuardRef = useRef(false);

  const currentExercise = exerciseList.find((e) => e.exerciseId === currentExerciseId);
  const currentPending = currentExercise ? pendingByExercise[currentExercise.exerciseId] : undefined;

  const totalTarget = exerciseList.reduce((sum, e) => sum + e.targetSets, 0);
  const totalLogged = exerciseList.reduce((sum, e) => sum + e.loggedSets.length, 0);
  const progressPct = totalTarget > 0 ? Math.round((totalLogged / totalTarget) * 100) : 0;

  function updateExercise(exerciseId: number, updater: (e: ExerciseVM) => ExerciseVM) {
    setExerciseList((list) => list.map((e) => (e.exerciseId === exerciseId ? updater(e) : e)));
  }

  function adjustPending(exerciseId: number, field: keyof Pending, delta: number) {
    setPendingByExercise((map) => {
      const current = map[exerciseId];
      const nextValue = Math.max(0, current[field] + delta);
      return { ...map, [exerciseId]: { ...current, [field]: nextValue } };
    });
  }

  function setPendingField(exerciseId: number, field: keyof Pending, value: number) {
    setPendingByExercise((map) => ({
      ...map,
      [exerciseId]: { ...map[exerciseId], [field]: Math.max(0, value) },
    }));
  }

  function handleLogSet(exercise: ExerciseVM) {
    if (logSetGuardRef.current) return;
    logSetGuardRef.current = true;

    const pending = pendingByExercise[exercise.exerciseId];
    startTransition(async () => {
      try {
        const newSet = await logSetAction(sessionId, exercise.exerciseId, pending.reps, pending.weightKg);
        const updatedLoggedSets = [...exercise.loggedSets, newSet];
        updateExercise(exercise.exerciseId, (e) => ({ ...e, loggedSets: updatedLoggedSets }));

        const nextPending = computePending(
          { ...exercise, loggedSets: updatedLoggedSets },
          updatedLoggedSets.length + 1
        );
        setPendingByExercise((map) => ({ ...map, [exercise.exerciseId]: nextPending }));
      } finally {
        logSetGuardRef.current = false;
      }
    });
  }

  function handleSetsStepper(exercise: ExerciseVM, delta: number) {
    const newTarget = Math.max(exercise.loggedSets.length, exercise.targetSets + delta);
    if (newTarget === exercise.targetSets) return;

    updateExercise(exercise.exerciseId, (e) => ({ ...e, targetSets: newTarget }));
    startTransition(async () => {
      const clamped = await updateTargetSetsAction(exercise.sessionExerciseId, newTarget);
      updateExercise(exercise.exerciseId, (e) => ({ ...e, targetSets: clamped }));
    });
  }

  function startEditingSet(set: LoggedSet) {
    setEditingSetId(set.id);
    setEditValues({ reps: set.reps, weightKg: set.weightKg });
  }

  function handleSaveEdit(exerciseId: number, setId: number) {
    startTransition(async () => {
      await updateSetAction(setId, editValues.reps, editValues.weightKg);
      updateExercise(exerciseId, (e) => ({
        ...e,
        loggedSets: e.loggedSets.map((s) => (s.id === setId ? { ...s, ...editValues } : s)),
      }));
      setEditingSetId(null);
    });
  }

  function handleDeleteSet(exerciseId: number, setId: number) {
    startTransition(async () => {
      await deleteSetAction(setId);
      updateExercise(exerciseId, (e) => ({
        ...e,
        loggedSets: e.loggedSets.filter((s) => s.id !== setId),
      }));
      setEditingSetId(null);
    });
  }

  if (!currentExercise || !currentPending) {
    return <div className="p-6 text-text">No exercises in this session.</div>;
  }

  const nextSetNumber = currentExercise.loggedSets.length + 1;

  return (
    <div className="flex h-dvh flex-col gap-4 bg-bg px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-xl font-semibold text-text">{planDay} session</p>
          <p className="text-sm text-text-muted">{exerciseList.length} exercises</p>
        </div>
        <Link href={`/session/${sessionId}/finish`} className={buttonClass("outline", "sm")}>
          Finish
        </Link>
      </header>

      <section className={cardClass}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={`line-clamp-2 font-bold text-text ${exerciseTitleClass(currentExercise.exerciseName)}`}
            >
              {currentExercise.exerciseName}
            </p>
            <p className="text-text-muted">
              Set {nextSetNumber} of {currentExercise.targetSets}
            </p>
          </div>
          <div>
            <p className="text-center text-sm text-text-muted">Sets</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetsStepper(currentExercise, -1)}
                className="h-10 w-10 rounded-xl bg-control text-xl text-text"
              >
                −
              </button>
              <span className="w-6 text-center text-lg text-text">
                {currentExercise.targetSets}
              </span>
              <button
                type="button"
                onClick={() => handleSetsStepper(currentExercise, 1)}
                className="h-10 w-10 rounded-xl bg-control text-xl text-text"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {currentExercise.lastTime && (
          <div className="mt-3 rounded-xl bg-control px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <ClockIcon />
              Last time · {formatShortDate(currentExercise.lastTime.date)}
            </p>
            <div className="mt-1 flex flex-col">
              {currentExercise.lastTime.sets.map((set) => (
                <p key={set.setNumber} className="text-sm text-text">
                  Set {set.setNumber} · {set.weightKg} kg × {set.reps}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-center text-sm text-text-muted">Weight (kg)</p>
            <div className="mt-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "weightKg", -2.5)}
                className="h-11 w-11 shrink-0 rounded-xl bg-control text-xl text-text"
              >
                −
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={currentPending.weightKg}
                onChange={(e) =>
                  setPendingField(currentExercise.exerciseId, "weightKg", Number(e.target.value))
                }
                className="w-full min-w-0 bg-transparent text-center text-3xl font-bold tabular-nums text-text"
              />
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "weightKg", 2.5)}
                className="h-11 w-11 shrink-0 rounded-xl bg-control text-xl text-text"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-center text-sm text-text-muted">Reps</p>
            <div className="mt-1 flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "reps", -1)}
                className="h-11 w-11 shrink-0 rounded-xl bg-control text-xl text-text"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={currentPending.reps}
                onChange={(e) =>
                  setPendingField(currentExercise.exerciseId, "reps", Number(e.target.value))
                }
                className="w-full min-w-0 bg-transparent text-center text-3xl font-bold tabular-nums text-text"
              />
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "reps", 1)}
                className="h-11 w-11 shrink-0 rounded-xl bg-control text-xl text-text"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleLogSet(currentExercise)}
          disabled={currentExercise.loggedSets.length >= currentExercise.targetSets || isPending}
          className={`mt-4 ${buttonClass("primary")}`}
        >
          {isPending && (
            <span
              aria-hidden
              className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
          {isPending ? "Logging…" : `Log set ${nextSetNumber}`}
        </button>

        {currentExercise.loggedSets.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {currentExercise.loggedSets.map((set) =>
              editingSetId === set.id ? (
                <div
                  key={set.id}
                  className="flex items-center gap-2 rounded-xl bg-control px-3 py-2"
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editValues.weightKg}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, weightKg: Number(e.target.value) }))
                    }
                    className="w-14 rounded bg-bg text-center text-base text-text"
                  />
                  <span className="text-text-muted">×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editValues.reps}
                    onChange={(e) => setEditValues((v) => ({ ...v, reps: Number(e.target.value) }))}
                    className="w-14 rounded bg-bg text-center text-base text-text"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(currentExercise.exerciseId, set.id)}
                    className="font-medium text-done"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSet(currentExercise.exerciseId, set.id)}
                    className="font-medium text-red-400"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSetId(null)}
                    className="text-text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => startEditingSet(set)}
                  className="flex items-center gap-2 text-left text-text"
                >
                  <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 fill-none stroke-done stroke-2">
                    <path d="M3 8.5L6.5 12L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Set {set.setNumber} · {set.weightKg} × {set.reps}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="w-8" aria-hidden />
          <span className="flex-1 text-sm text-text-muted">Today</span>
          <span className="w-12 text-right text-sm text-text-muted">Sets</span>
          <span className="w-10 text-right text-sm text-text-muted">Reps</span>
          <span className="w-14 text-right text-sm text-text-muted">Kg</span>
        </div>

        <ul className="flex-1 overflow-y-auto">
          {exerciseList.map((exercise) => {
            const state = stateFor(exercise, currentExerciseId);
            const lastSet = exercise.loggedSets[exercise.loggedSets.length - 1];
            const repsDisplay = lastSet ? lastSet.reps : exercise.targetReps;
            const weightDisplay = lastSet
              ? lastSet.weightKg
              : exercise.lastTime
                ? exercise.lastTime.sets[0].weightKg
                : "—";
            const isCurrent = state === "current";

            return (
              <li key={exercise.sessionExerciseId}>
                <button
                  type="button"
                  onClick={() => setCurrentExerciseId(exercise.exerciseId)}
                  className={`flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left first:border-t-0 ${
                    isCurrent ? "bg-card-current" : ""
                  }`}
                >
                  <StateIndicator state={state} />
                  <span className="flex-1 text-base font-medium text-text">
                    {exercise.exerciseName}
                  </span>
                  <span
                    className={`w-12 text-right text-base ${isCurrent ? "text-accent" : "text-text-muted"}`}
                  >
                    {exercise.loggedSets.length}/{exercise.targetSets}
                  </span>
                  <span
                    className={`w-10 text-right text-base ${isCurrent ? "text-accent" : "text-text-muted"}`}
                  >
                    {repsDisplay}
                  </span>
                  <span
                    className={`w-14 text-right text-base ${isCurrent ? "text-accent" : "text-text-muted"}`}
                  >
                    {weightDisplay}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="pb-1">
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>
            {totalLogged} of {totalTarget} sets
          </span>
          <span>{progressPct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-control">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progressPct}%` }} />
        </div>
      </footer>
    </div>
  );
}
