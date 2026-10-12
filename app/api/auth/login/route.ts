/**
 * @file app/api/auth/login/route.ts
 * @description REST API Route: POST /api/auth/login
 * 
 * Industry Pattern: Standard REST API endpoint for user authentication.
 * Used by external clients, mobile applications, or programmatic API consumers.
 */

import { NextResponse } from "next/server";
import { LoginSchema } from "@/schemas";
import { authenticateUser, createSession } from "@/services/auth.service";

/**
 * Handles user login requests via POST JSON payload.
 * 
 * @param {Request} request - Incoming HTTP request.
 * @returns {Promise<NextResponse>} JSON response with session status or validation errors.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const authResult = await authenticateUser(email, password);

    if (!authResult.ok) {
      return NextResponse.json(
        { ok: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Set secure HTTP-only session cookie
    await createSession(authResult.user.id, authResult.user.role);

    return NextResponse.json(
      {
        ok: true,
        message: "Login successful",
        user: { id: authResult.user.id, role: authResult.user.role },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/auth/login] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
