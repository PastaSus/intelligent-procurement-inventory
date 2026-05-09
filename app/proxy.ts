import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import type { SessionPayload } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "your-session-secret-here",
);

const SESSION_COOKIE_NAME = "session";
const PUBLIC_ROUTES = ["/", "/login", "/forgot-password"];

// Admin-only routes that require ADMIN role
const ADMIN_ROUTES = ["/dashboard/admin", "/dashboard/users", "/dashboard/settings"];

// Staff routes - accessible to both ADMIN and STAFF
const STAFF_ROUTES = ["/dashboard", "/inventory", "/vendors", "/orders"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Protected routes require valid session
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/inventory") || pathname.startsWith("/vendors") || pathname.startsWith("/orders")) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      const session = verified.payload as SessionPayload;

      // Check if route requires ADMIN role
      if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
        if (session.role !== "ADMIN") {
          // Redirect unauthorized users to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      return NextResponse.next();
    } catch (err) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
