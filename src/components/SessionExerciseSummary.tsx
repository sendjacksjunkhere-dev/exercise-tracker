export type SummaryExercise = {
  exerciseId: number;
  order: number;
  exerciseName: string;
};

export type SummarySet = {
  exerciseId: number;
  setNumber: number;
  reps: number;
  weightKg: number;
};

export function SessionExerciseSummary({
  exercises,
  sets,
}: {
  exercises: SummaryExercise[];
  sets: SummarySet[];
}) {
  return (
    <ul className="mt-4 flex flex-col gap-4">
      {exercises.map((exercise) => {
        const exerciseSets = sets.filter((s) => s.exerciseId === exercise.exerciseId);
        return (
          <li
            key={exercise.exerciseId}
            className="rounded-lg bg-white p-4 shadow-sm dark:bg-zinc-900"
          >
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
  );
}
