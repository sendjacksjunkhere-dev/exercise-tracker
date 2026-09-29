"use server";

import { redirect } from "next/navigation";
import { deleteSession, startSession as createSession } from "@/lib/session";

export async function startSession(formData: FormData) {
  const day = formData.get("day");
  if (typeof day !== "string" || day.length === 0) {
    throw new Error("Missing day");
  }

  const sessionId = await createSession(day);
  redirect(`/session/${sessionId}`);
}

export async function discardSessionAction(sessionId: string) {
  await deleteSession(sessionId);
  redirect("/");
}
