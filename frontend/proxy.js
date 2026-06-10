import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Grab the shared secret key from .env.local
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET_KEY);

export async function proxy(req) {
  // 1. Correct cookie name!
  const sessionCookie = req.cookies.get("session")?.value;
  const { pathname } = req.nextUrl;

  // 2. Prevent logged-in users from seeing the Login page
  if (sessionCookie && (pathname.startsWith("/login") || pathname === "/")) {
    try {
      const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
      if (payload.role) {
        return NextResponse.redirect(new URL(`/${payload.role}/dashboard`, req.url));
      }
    } catch (err) {
      // If token is somehow bad, do nothing and let them log in
    }
  }

  // Allow public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/select-role")) {
    return NextResponse.next();
  }

  // 3. Kick out completely unauthenticated users
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 4. Strict Role-Based Cross-Routing
  try {
    const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
    const role = payload.role;

    // Force users to pick a role if they haven't yet
    if (!role && !pathname.startsWith("/select-role")) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }

    // 🚨 Block Investor from entering Founder routes
    if (role === "investor" && pathname.startsWith("/founder")) {
      return NextResponse.redirect(new URL("/investor/dashboard", req.url));
    }

    // 🚨 Block Founder from entering Investor routes
    if (role === "founder" && pathname.startsWith("/investor")) {
      return NextResponse.redirect(new URL("/founder/dashboard", req.url));
    }

    return NextResponse.next();

  }catch (error) {
    // 🚨 ADD THIS PRINT STATEMENT:
    console.log("🚨 PROXY REJECTED TOKEN BECAUSE:", error.code, error.message);
    
    // If the JWT expired or is invalid, wipe it and force login
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete("session"); // <-- This is what is deleting your cookie!
    return response;
  
}}

// Ensure the proxy runs on all these paths
export const config = {
  matcher: [
    "/founder/:path*", 
    "/investor/:path*", 
    "/admin/:path*", 
    "/select-role",
    "/login",
    "/"
  ],
};