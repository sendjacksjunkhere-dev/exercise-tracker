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
  weightKg: number | null;
  notes?: string;
  videoUrl?: string;
};

export type PlanDay = {
  day: string;
  exercises: PlanExercise[];
};

function buildHeaderIndex(headerRow: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headerRow.forEach((name, i) => {
    const trimmed = name?.trim();
    if (trimmed) map.set(trimmed, i);
  });
  return map;
}

function cell(row: string[], index: Map<string, number>, name: string): string | undefined {
  const i = index.get(name);
  return i === undefined ? undefined : row[i];
}

export function parsePlanRows(rows: string[][]): PlanDay[] {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headerIndex = buildHeaderIndex(headerRow);
  const byDay = new Map<string, PlanExercise[]>();

  for (const row of dataRows) {
    const day = cell(row, headerIndex, "Day");
    const orderRaw = cell(row, headerIndex, "Order");
    const exercise = cell(row, headerIndex, "Exercise");
    const setsRaw = cell(row, headerIndex, "Sets");
    const repsRaw = cell(row, headerIndex, "Reps");
    const weightRaw = cell(row, headerIndex, "Weight (kg)");
    const notesRaw = cell(row, headerIndex, "Notes");
    const videoUrlRaw = cell(row, headerIndex, "Video URL");

    const trimmedDay = day?.trim();
    const trimmedExercise = exercise?.trim();
    if (!trimmedDay || !trimmedExercise) {
      continue;
    }

    const notes = notesRaw?.trim();
    const videoUrl = videoUrlRaw?.trim();
    const trimmedSets = setsRaw?.trim();
    const trimmedReps = repsRaw?.trim();
    const trimmedWeight = weightRaw?.trim();

    const planExercise: PlanExercise = {
      order: Number(orderRaw),
      exercise: trimmedExercise,
      sets: trimmedSets ? Number(trimmedSets) : 1,
      reps: trimmedReps ? Number(trimmedReps) : null,
      weightKg: trimmedWeight ? Number(trimmedWeight) : null,
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
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) return [];

  const headerIndex = buildHeaderIndex(headerRow);
  const warnings: string[] = [];

  for (const row of dataRows) {
    const day = cell(row, headerIndex, "Day");
    const orderRaw = cell(row, headerIndex, "Order");
    const exercise = cell(row, headerIndex, "Exercise");
    const trimmedDay = day?.trim();
    const trimmedExercise = exercise?.trim();

    if (trimmedDay && !trimmedExercise) {
      const order = orderRaw?.trim() || "?";
      warnings.push(`Skipped a row for ${trimmedDay} (order ${order}): missing exercise name.`);
    }
  }

  return warnings;
}
