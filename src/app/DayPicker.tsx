"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WEEKDAYS } from "@/lib/planParser";

export function DayPicker({ selectedDay }: { selectedDay: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDay, setPendingDay] = useState<string | null>(null);

  function handleClick(day: string) {
    if (day === selectedDay || isPending) return;
    setPendingDay(day);
    startTransition(() => {
      router.push(`/?day=${day}`);
    });
  }

  return (
    <nav className="flex w-full max-w-md flex-wrap justify-center gap-2">
      {WEEKDAYS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => handleClick(day)}
          disabled={isPending}
          className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60 ${
            day === selectedDay
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-zinc-200 text-black dark:bg-zinc-800 dark:text-zinc-50"
          }`}
        >
          {day}
          {isPending && pendingDay === day && (
            <span
              aria-hidden
              className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
        </button>
      ))}
    </nav>
  );
}
