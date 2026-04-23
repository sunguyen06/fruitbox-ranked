import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = !!getSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/profile")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (hasSession && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/sign-in", "/sign-up"],
};
