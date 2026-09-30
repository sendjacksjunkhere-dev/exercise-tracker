"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass } from "@/lib/ui";

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
      className={buttonClass("primary")}
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
