import { NextRequest, NextResponse } from "next/server";

// Name of the cookie the backend sets on login (utils/authentication.ts)
const LOGIN_COOKIE = "login-token";

// Optimistic check only: no cookie -> straight to the login page.
// The real check (valid token, active staff user) happens in
// app/(portal)/layout.tsx and in every backend route.
export function proxy(request: NextRequest) {
  if (!request.cookies.has(LOGIN_COOKIE)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|login|_next/static|_next/image|favicon.ico).*)"],
};
