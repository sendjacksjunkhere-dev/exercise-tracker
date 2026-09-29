export const SESSION_COOKIE_NAME = "exercise_tracker_session";

export async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getExpectedSessionValue(): Promise<string> {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    throw new Error("APP_PASSWORD env var is not set");
  }
  return hashPassword(appPassword);
}
