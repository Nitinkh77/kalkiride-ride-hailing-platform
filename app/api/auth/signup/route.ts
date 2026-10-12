/**
 * @file app/api/auth/signup/route.ts
 * @description REST API Route: POST /api/auth/signup
 * 
 * Industry Pattern: Standard REST API endpoint for user registration.
 */

import { NextResponse } from "next/server";
import { SignupSchema } from "@/schemas";
import { registerUser, createSession } from "@/services/auth.service";

/**
 * Handles user signup requests via JSON payload.
 * 
 * @param {Request} request - Incoming HTTP request.
 * @returns {Promise<NextResponse>} JSON response with registration status.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await registerUser(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, field: result.field },
        { status: 409 }
      );
    }

    // Automatically establish session for newly registered user
    await createSession(result.user.id, result.user.role);

    return NextResponse.json(
      {
        ok: true,
        message: "Registration successful",
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/signup] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
