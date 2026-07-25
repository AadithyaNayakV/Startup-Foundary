import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "fallback-dev-secret-key-change-in-prod"
);

export async function middleware(req) {
  const sessionCookie = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // 1. Prevent logged-in users from seeing login page or root if authenticated
  if (sessionCookie && (pathname.startsWith("/login") || pathname === "/")) {
    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      if (payload.role) {
        return NextResponse.redirect(
          new URL(`/${payload.role}/dashboard`, req.url)
        );
      }
    } catch {
      // If token is invalid or expired, continue to login
    }
  }

  // Allow public auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/select-role")) {
    return NextResponse.next();
  }

  // 2. Unauthenticated users redirect to login
  if (!sessionCookie) {
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
    console.log("🚨 MIDDLEWARE REJECTED TOKEN:", error.code, error.message);

    const response = NextResponse.redirect(new URL("/login", req.url));
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
