"use client";

import { useState, useTransition } from "react";
import { formatLastTime, type LastTime } from "@/lib/lastTime";
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

const DEFAULT_WEIGHT_KG = 20;

function initialPending(exercise: ExerciseVM): Pending {
  const last = exercise.loggedSets[exercise.loggedSets.length - 1];
  if (last) {
    return { reps: last.reps, weightKg: last.weightKg };
  }

  const lastTimeFirstSet = exercise.lastTime?.sets[0];
  if (lastTimeFirstSet) {
    return { reps: lastTimeFirstSet.reps, weightKg: lastTimeFirstSet.weightKg };
  }

  return { reps: exercise.targetReps, weightKg: DEFAULT_WEIGHT_KG };
}

function stateFor(exercise: ExerciseVM, currentExerciseId: number): "done" | "current" | "started" | "empty" {
  if (exercise.loggedSets.length >= exercise.targetSets) return "done";
  if (exercise.exerciseId === currentExerciseId) return "current";
  if (exercise.loggedSets.length > 0) return "started";
  return "empty";
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
      map[exercise.exerciseId] = initialPending(exercise);
    }
    return map;
  });
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Pending>({ reps: 0, weightKg: 0 });
  const [, startTransition] = useTransition();

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
    const pending = pendingByExercise[exercise.exerciseId];
    startTransition(async () => {
      const newSet = await logSetAction(sessionId, exercise.exerciseId, pending.reps, pending.weightKg);
      updateExercise(exercise.exerciseId, (e) => ({ ...e, loggedSets: [...e.loggedSets, newSet] }));
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
    return <div className="p-6">No exercises in this session.</div>;
  }

  return (
    <div className="flex h-dvh flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div>
          <p className="text-lg font-semibold text-black dark:text-zinc-50">{planDay} session</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {exerciseList.length} exercises
          </p>
        </div>
        <button
          type="button"
          disabled
          className="h-11 rounded-lg bg-zinc-300 px-4 font-medium text-zinc-500 dark:bg-zinc-800"
        >
          Finish
        </button>
      </header>

      <section className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-semibold text-black dark:text-zinc-50">
              {currentExercise.exerciseName}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Set {currentExercise.loggedSets.length + 1} of {currentExercise.targetSets}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetsStepper(currentExercise, -1)}
              className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
            >
              −
            </button>
            <span className="w-6 text-center text-zinc-600 dark:text-zinc-400">
              {currentExercise.targetSets}
            </span>
            <button
              type="button"
              onClick={() => handleSetsStepper(currentExercise, 1)}
              className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
            >
              +
            </button>
          </div>
        </div>

        {currentExercise.lastTime && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Last time: {formatLastTime(currentExercise.lastTime)} · {currentExercise.lastTime.date}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Weight (kg)</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "weightKg", -2.5)}
                className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
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
                className="w-16 rounded-lg border border-zinc-300 bg-white text-center text-2xl font-semibold text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "weightKg", 2.5)}
                className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Reps</p>
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "reps", -1)}
                className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
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
                className="w-16 rounded-lg border border-zinc-300 bg-white text-center text-2xl font-semibold text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={() => adjustPending(currentExercise.exerciseId, "reps", 1)}
                className="h-11 w-11 rounded-lg bg-zinc-200 text-xl dark:bg-zinc-800 dark:text-zinc-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleLogSet(currentExercise)}
          disabled={currentExercise.loggedSets.length >= currentExercise.targetSets}
          className="mt-4 h-14 w-full rounded-lg bg-black text-lg font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          Log set
        </button>

        {currentExercise.loggedSets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {currentExercise.loggedSets.map((set) =>
              editingSetId === set.id ? (
                <div
                  key={set.id}
                  className="flex items-center gap-2 rounded-full bg-zinc-200 px-3 py-1 dark:bg-zinc-800"
                >
                  <input
                    type="number"
                    inputMode="decimal"
                    value={editValues.weightKg}
                    onChange={(e) =>
                      setEditValues((v) => ({ ...v, weightKg: Number(e.target.value) }))
                    }
                    className="w-14 rounded bg-white text-center dark:bg-zinc-900"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editValues.reps}
                    onChange={(e) => setEditValues((v) => ({ ...v, reps: Number(e.target.value) }))}
                    className="w-14 rounded bg-white text-center dark:bg-zinc-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(currentExercise.exerciseId, set.id)}
                    className="font-medium text-green-700 dark:text-green-400"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSet(currentExercise.exerciseId, set.id)}
                    className="font-medium text-red-700 dark:text-red-400"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSetId(null)}
                    className="text-zinc-500 dark:text-zinc-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => startEditingSet(set)}
                  className="rounded-full bg-zinc-200 px-3 py-1 text-sm dark:bg-zinc-800"
                >
                  Set {set.setNumber} · {set.weightKg} × {set.reps}
                </button>
              )
            )}
          </div>
        )}
      </section>

      <div className="flex-1 overflow-y-auto">
        <ul>
          {exerciseList.map((exercise) => {
            const state = stateFor(exercise, currentExerciseId);
            const lastSet = exercise.loggedSets[exercise.loggedSets.length - 1];
            const repsDisplay = lastSet ? lastSet.reps : exercise.targetReps;
            const weightDisplay = lastSet ? `${lastSet.weightKg} kg` : "—";

            return (
              <li key={exercise.sessionExerciseId}>
                <button
                  type="button"
                  onClick={() => setCurrentExerciseId(exercise.exerciseId)}
                  className={`flex w-full items-center gap-3 border-b border-zinc-200 px-4 py-3 text-left dark:border-zinc-800 ${
                    state === "current" ? "bg-zinc-200 dark:bg-zinc-800" : ""
                  }`}
                >
                  <span aria-hidden>
                    {state === "done" && "✓"}
                    {state === "current" && "◎"}
                    {state === "started" && "●"}
                    {state === "empty" && "○"}
                  </span>
                  <span className="flex-1 text-black dark:text-zinc-50">
                    {exercise.exerciseName}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {exercise.loggedSets.length}/{exercise.targetSets}
                  </span>
                  <span className="w-10 text-right text-sm text-zinc-500 dark:text-zinc-400">
                    {repsDisplay}
                  </span>
                  <span className="w-16 text-right text-sm text-zinc-500 dark:text-zinc-400">
                    {weightDisplay}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-black dark:bg-white" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {totalLogged} of {totalTarget} sets · {progressPct}%
        </p>
      </footer>
    </div>
  );
}
