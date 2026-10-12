/**
 * @file app/api/auth/google/route.ts
 * @description Initiates Google OAuth 2.0 Authorization Flow.
 * 
 * Flow:
 * 1. Checks if Google OAuth credentials exist.
 * 2. Generates a random cryptographic state token and stores it in an HTTP-only cookie.
 * 3. Saves requested `redirectTo` and `role` parameters in the state cookie.
 * 4. Redirects visitor to Google's consent screen.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGoogleOAuthUrl,
  isGoogleOAuthConfigured,
  getOAuthRedirectUri,
} from "@/services/google-auth.service";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectTo = searchParams.get("redirectTo") || "/ride-details";
  const role = searchParams.get("role") || "customer";
  const mode = searchParams.get("mode") || "login";

  // Check if credentials are set
  if (!isGoogleOAuthConfigured()) {
    const errorUrl = new URL(mode === "signup" ? "/signup" : "/login", origin);
    errorUrl.searchParams.set(
      "error",
      "Google OAuth is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables."
    );
    return NextResponse.redirect(errorUrl.toString());
  }

  // Determine consistent redirect URI
  const redirectUri = getOAuthRedirectUri(request);

  // Cryptographic state for CSRF protection
  const state = crypto.randomUUID();

  // Construct Google OAuth URL
  const googleAuthUrl = getGoogleOAuthUrl(state, redirectUri);

  // Store state + metadata in secure HTTP-only cookie
  const cookiePayload = JSON.stringify({ state, redirectTo, role, redirectUri, mode });
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", cookiePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return NextResponse.redirect(googleAuthUrl);
}
