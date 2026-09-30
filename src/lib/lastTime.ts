export type LastTimeSetRow = {
  sessionId: string;
  sessionDate: string;
  sessionStartedAt: Date;
  setNumber: number;
  reps: number;
  weightKg: number;
};

export type LastTime = {
  date: string;
  sets: { setNumber: number; reps: number; weightKg: number }[];
};

export function pickLastTime(
  rows: LastTimeSetRow[],
  currentSessionId: string
): LastTime | null {
  const candidates = rows.filter((row) => row.sessionId !== currentSessionId);

  if (candidates.length === 0) {
    return null;
  }

  const latestSessionId = candidates.reduce((latest, row) =>
    row.sessionStartedAt > latest.sessionStartedAt ? row : latest
  ).sessionId;

  const setsForLatest = candidates
    .filter((row) => row.sessionId === latestSessionId)
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((row) => ({ setNumber: row.setNumber, reps: row.reps, weightKg: row.weightKg }));

  const date = candidates.find((row) => row.sessionId === latestSessionId)!.sessionDate;

  return { date, sets: setsForLatest };
}

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${WEEKDAY_ABBR[date.getUTCDay()]} ${day} ${MONTH_ABBR[date.getUTCMonth()]}`;
}

export function formatLastTime(lastTime: LastTime): string {
  const uniqueWeights = new Set(lastTime.sets.map((set) => set.weightKg));
  const repsList = lastTime.sets.map((set) => set.reps).join(", ");

  if (uniqueWeights.size <= 1) {
    return `${lastTime.sets[0].weightKg} kg × ${repsList}`;
  }

  return lastTime.sets.map((set) => `${set.weightKg} kg × ${set.reps}`).join(", ");
}
