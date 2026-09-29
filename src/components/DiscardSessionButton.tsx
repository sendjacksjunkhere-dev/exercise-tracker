"use client";

import { useTransition } from "react";
import { discardSessionAction } from "@/app/actions";

export function DiscardSessionButton({
  sessionId,
  label = "Discard session",
  className,
}: {
  sessionId: string;
  label?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      "Discard this session? This deletes all its logged sets and can't be undone."
    );
    if (!confirmed) return;

    startTransition(async () => {
      await discardSessionAction(sessionId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        className ??
        "font-medium text-red-700 disabled:opacity-50 dark:text-red-400"
      }
    >
      {isPending ? "Discarding…" : label}
    </button>
  );
}
