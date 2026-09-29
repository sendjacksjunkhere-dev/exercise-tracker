"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";

export function StartSessionButton() {
  const { pending } = useFormStatus();
  const submittedRef = useRef(false);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (submittedRef.current) {
          e.preventDefault();
          return;
        }
        submittedRef.current = true;
      }}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-black text-lg font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
    >
      {pending && (
        <span
          aria-hidden
          className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {pending ? "Starting…" : "Start session"}
    </button>
  );
}
