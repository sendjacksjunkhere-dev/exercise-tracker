"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, getExpectedSessionValue, hashPassword } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter the password" };
  }

  const [hashed, expected] = await Promise.all([
    hashPassword(password),
    getExpectedSessionValue(),
  ]);

  if (hashed !== expected) {
    return { error: "Incorrect password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
