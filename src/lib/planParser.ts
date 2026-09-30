export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type PlanExercise = {
  order: number;
  exercise: string;
  sets: number;
  reps: number | null;
  notes?: string;
  videoUrl?: string;
};

export type PlanDay = {
  day: string;
  exercises: PlanExercise[];
};

export function parsePlanRows(rows: string[][]): PlanDay[] {
  const byDay = new Map<string, PlanExercise[]>();

  for (const row of rows) {
    const [day, orderRaw, exercise, setsRaw, repsRaw, notesRaw, videoUrlRaw] = row;

    const trimmedDay = day?.trim();
    const trimmedExercise = exercise?.trim();
    if (!trimmedDay || !trimmedExercise) {
      continue;
    }

    const notes = notesRaw?.trim();
    const videoUrl = videoUrlRaw?.trim();
    const trimmedSets = setsRaw?.trim();
    const trimmedReps = repsRaw?.trim();

    const planExercise: PlanExercise = {
      order: Number(orderRaw),
      exercise: trimmedExercise,
      sets: trimmedSets ? Number(trimmedSets) : 1,
      reps: trimmedReps ? Number(trimmedReps) : null,
      ...(notes ? { notes } : {}),
      ...(videoUrl ? { videoUrl } : {}),
    };

    const existing = byDay.get(trimmedDay);
    if (existing) {
      existing.push(planExercise);
    } else {
      byDay.set(trimmedDay, [planExercise]);
    }
  }

  return Array.from(byDay.entries()).map(([day, exercises]) => ({
    day,
    exercises: exercises.slice().sort((a, b) => a.order - b.order),
  }));
}

export function getPlanWarnings(rows: string[][]): string[] {
  const warnings: string[] = [];

  for (const row of rows) {
    const [day, orderRaw, exercise] = row;
    const trimmedDay = day?.trim();
    const trimmedExercise = exercise?.trim();

    if (trimmedDay && !trimmedExercise) {
      const order = orderRaw?.trim() || "?";
      warnings.push(`Skipped a row for ${trimmedDay} (order ${order}): missing exercise name.`);
    }
  }

  return warnings;
}
