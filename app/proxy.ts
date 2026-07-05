import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { SessionPayload } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "your-session-secret-here",
);

const SESSION_COOKIE_NAME = "session";
const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

const ADMIN_ROUTES = ["/dashboard/admin", "/dashboard/users", "/dashboard/settings"];
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
      const verified = await jwtVerify(token, JWT_SECRET);
      const session = verified.payload as SessionPayload;

      if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        if (session.role !== "ADMIN") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

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
