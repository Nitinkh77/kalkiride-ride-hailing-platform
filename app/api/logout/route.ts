/**
 * @file app/api/logout/route.ts
 * @description Backward-compatible alias for /api/logout.
 * Handles both GET (direct browser navigation) and POST (fetch/form).
 *
 * Cookie is deleted directly on the response to avoid next/headers context issues
 * that can arise in route handlers on Vercel (protocol mismatch, etc.).
 */

import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "session";

function buildLogoutResponse(request: NextRequest): NextResponse {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const response = NextResponse.redirect(new URL("/login", siteUrl), {
    status: 303, // 303 See Other — forces GET after POST redirect
  });

  // Delete the session cookie by expiring it on the response directly
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

/** Handles GET — browser navigates directly to /api/logout */
export async function GET(request: NextRequest) {
  return buildLogoutResponse(request);
}

/** Handles POST — fetch/form-based logout */
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