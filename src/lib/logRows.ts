import { formatSydneyTime } from "./timezone";

export type LogRowInput = {
  sessionId: string;
  date: string;
  planDay: string;
  startedAt: Date;
  lastLoggedAt: Date;
  exerciseOrder: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number;
  notes: string | null;
};

export function durationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

export function formatLogRows(inputs: LogRowInput[]): string[][] {
  return inputs
    .slice()
    .sort((a, b) => a.exerciseOrder - b.exerciseOrder || a.setNumber - b.setNumber)
    .map((row) => [
      row.sessionId,
      row.date,
      row.planDay,
      formatSydneyTime(row.startedAt),
      String(durationMinutes(row.startedAt, row.lastLoggedAt)),
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
