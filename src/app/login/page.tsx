"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-6 dark:bg-black">
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-center text-2xl font-semibold text-black dark:text-zinc-50">
          Exercise Tracker
        </h1>
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="h-14 w-full rounded-lg border border-zinc-300 px-4 text-lg text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        {state.error && (
          <p className="text-center text-red-600 dark:text-red-400">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="h-14 w-full rounded-lg bg-black text-lg font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {pending ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
