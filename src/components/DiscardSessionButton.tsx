"use client";

import { useTransition } from "react";
import { discardSessionAction } from "@/app/actions";
import { buttonClass } from "@/lib/ui";

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
      className={className ?? buttonClass("dangerOutline", "sm")}
    >
      {isPending ? "Discarding…" : label}
    </button>
  );
}
