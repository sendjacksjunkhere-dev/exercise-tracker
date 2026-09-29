export type LogRowInput = {
  sessionId: string;
  date: string;
  planDay: string;
  exerciseOrder: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes: string | null;
};

export function formatLogRows(inputs: LogRowInput[]): string[][] {
  return inputs
    .slice()
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder || a.setNumber - b.setNumber)
    .map((row) => [
      row.sessionId,
      row.date,
      row.planDay,
      row.exerciseName,
      String(row.setNumber),
      String(row.reps),
      String(row.weightKg),
      row.notes ?? "",
    ]);
}

export function isAlreadyPushed(existingSessionIds: string[], sessionId: string): boolean {
  return existingSessionIds.includes(sessionId);
}
