/**
 * @file app/api/auth/logout/route.ts
 * @description REST API Route: GET+POST /api/auth/logout
 *
 * Clears the user's session cookie by expiring it directly on the response.
 * Does NOT use cookies() from next/headers to avoid protocol-mismatch errors
 * on Vercel where the cookie may have been set under a different protocol.
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "session";

function buildLogoutResponse(request: NextRequest): NextResponse {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const response = NextResponse.redirect(new URL("/login", siteUrl), {
    status: 303, // 303 See Other — forces browser to GET after a POST redirect
  });

  // Expire the session cookie directly on the response
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

/** Handles GET — browser navigates directly to /api/auth/logout */
export async function GET(request: NextRequest) {
  return buildLogoutResponse(request);
}

/**
 * Logs out the currently authenticated user.
 */
export async function POST(request: NextRequest) {
  // If client requested JSON, expire cookie and return JSON
  if (request.headers.get("accept")?.includes("application/json")) {
    const res = NextResponse.json({ ok: true, message: "Logged out successfully" });
    res.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  return buildLogoutResponse(request);
}
