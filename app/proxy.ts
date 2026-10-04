import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "your-session-secret-here",
);

const SESSION_COOKIE_NAME = "session";
const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

const PROTECTED_PREFIXES = ["/dashboard"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  if (PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);

      // Role enforcement lives in per-page session checks and server-action gates.
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
