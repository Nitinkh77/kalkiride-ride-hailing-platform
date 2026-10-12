/**
 * @file app/api/auth/session/route.ts
 * @description REST API Route: GET /api/auth/session
 * 
 * Returns the currently active session user ID and role, or 401 Unauthorized.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, session: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    session: {
      userId: session.userId,
      role: session.role,
      expiresAt: session.expiresAt,
    },
  });
}
