import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getExpectedSessionValue } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const expected = await getExpectedSessionValue();

  if (sessionCookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login).*)"],
};
