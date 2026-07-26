import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "fallback-dev-secret-key-change-in-prod"
);

export async function proxy(req) {
  const sessionCookie = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // 1. Explicit check for /admin/login:
  // Only redirect if user is ALREADY authenticated specifically as an admin.
  // Allow founders/investors or unauthenticated users to view /admin/login.
  if (pathname === "/admin/login") {
    if (sessionCookie) {
      try {
        const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
        if (payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin/audit", req.url));
        }
      } catch {
        // Expired/invalid token, proceed to /admin/login
      }
    }
    return NextResponse.next();
  }

  // 2. Prevent logged-in users from seeing main login page or root if authenticated
  if (sessionCookie && (pathname === "/login" || pathname === "/")) {
    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      if (payload.role) {
        const targetDashboard =
          payload.role === "admin" ? "/admin/audit" : `/${payload.role}/dashboard`;
        return NextResponse.redirect(
          new URL(targetDashboard, req.url)
        );
      }
    } catch {
      // If token is invalid or expired, continue to login
    }
  }

  // Allow public auth routes
  if (pathname === "/login" || pathname.startsWith("/select-role")) {
    return NextResponse.next();
  }

  // 3. Unauthenticated users redirect to appropriate login route
  if (!sessionCookie) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 3. Role-Based Access Control
  try {
    const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
    const role = payload.role;

    // Force users to pick a role if they haven't yet
    if (!role && !pathname.startsWith("/select-role")) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }

    // Block Investor from entering Founder routes
    if (role === "investor" && pathname.startsWith("/founder")) {
      return NextResponse.redirect(new URL("/investor/dashboard", req.url));
    }

    // Block Founder from entering Investor routes
    if (role === "founder" && pathname.startsWith("/investor")) {
      return NextResponse.redirect(new URL("/founder/dashboard", req.url));
    }

    // Block non-Admin from entering Admin routes
    if (role !== "admin" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL(role ? `/${role}/dashboard` : "/select-role", req.url)
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.log("🚨 PROXY REJECTED TOKEN:", error.code, error.message);

    const redirectPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    const response = NextResponse.redirect(new URL(redirectPath, req.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: [
    "/founder/:path*",
    "/investor/:path*",
    "/admin/:path*",
    "/select-role",
    "/login",
    "/",
  ],
};