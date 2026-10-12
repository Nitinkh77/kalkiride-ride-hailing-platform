/**
 * @file app/api/auth/google/callback/route.ts
 * @description Google OAuth 2.0 Callback Handler.
 * 
 * Flow:
 * 1. Reads incoming authorization code and state parameter from Google.
 * 2. Compares state against secure HTTP-only state cookie to prevent CSRF attacks.
 * 3. Exchanges authorization code for Google access token.
 * 4. Retrieves verified Google user profile.
 * 5. Calls `findOrCreateGoogleUser` in the authentication service.
 * 6. Creates a JWT session cookie for the user.
 * 7. Redirects user to their requested destination or dashboard.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  exchangeGoogleCode,
  getGoogleUserInfo,
  getOAuthRedirectUri,
} from "@/services/google-auth.service";
import {
  findOrCreateGoogleUser,
  createSession,
} from "@/services/auth.service";
import type { UserRole } from "@/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Verify CSRF state from cookie early to determine source mode (signup vs login)
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  let savedState: {
    state: string;
    redirectTo?: string;
    role?: UserRole;
    redirectUri?: string;
    mode?: "login" | "signup";
  } | null = null;

  if (stateCookie) {
    try {
      savedState = JSON.parse(stateCookie);
    } catch {
      // Cookie corrupted
    }
  }

  const isSignup = savedState?.mode === "signup";
  const errorRedirectUrl = new URL(isSignup ? "/signup" : "/login", origin);
  if (savedState?.redirectTo && savedState.redirectTo.startsWith("/") && savedState.redirectTo !== "/") {
    errorRedirectUrl.searchParams.set("redirectTo", savedState.redirectTo);
  }

  // User cancelled or Google returned an error
  if (errorParam) {
    errorRedirectUrl.searchParams.set(
      "error",
      `Google ${isSignup ? "sign up" : "sign in"} was cancelled or encountered an error.`
    );
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  if (!code || !state) {
    errorRedirectUrl.searchParams.set(
      "error",
      "Invalid Google authorization response. Missing code or state."
    );
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  if (!savedState) {
    errorRedirectUrl.searchParams.set(
      "error",
      `Google ${isSignup ? "sign up" : "sign in"} session timed out. Please try again.`
    );
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  if (savedState.state !== state) {
    errorRedirectUrl.searchParams.set(
      "error",
      "OAuth security verification failed (state mismatch). Please try again."
    );
    return NextResponse.redirect(errorRedirectUrl.toString());
  }

  try {
    const redirectUri = savedState.redirectUri || getOAuthRedirectUri(request);

    // 1. Exchange code for access token
    const tokenData = await exchangeGoogleCode(code, redirectUri);

    // 2. Fetch user profile from Google OpenID endpoint
    const googleUser = await getGoogleUserInfo(tokenData.access_token);

    // 3. Find or register user in database
    const authResult = await findOrCreateGoogleUser({
      name: googleUser.name,
      email: googleUser.email,
      role: savedState.role || "customer",
    });

    if (!authResult.ok) {
      errorRedirectUrl.searchParams.set("error", authResult.error);
      return NextResponse.redirect(errorRedirectUrl.toString());
    }

    // 4. Create encrypted HTTP-only session cookie
    await createSession(authResult.user.id, authResult.user.role);

    // 5. Redirect user to destination or role dashboard
    const targetUrl =
      savedState.redirectTo &&
      savedState.redirectTo.startsWith("/") &&
      savedState.redirectTo !== "/"
        ? new URL(savedState.redirectTo, origin)
        : new URL(
            authResult.user.role === "driver" ? "/dashboard/driver" : "/ride-details",
            origin
          );

    return NextResponse.redirect(targetUrl.toString());
  } catch (error) {
    console.error("[GET /api/auth/google/callback] Error:", error);
    const message =
      error instanceof Error
        ? error.message
        : `Google ${isSignup ? "sign up" : "sign in"} failed.`;
    errorRedirectUrl.searchParams.set("error", message);
    return NextResponse.redirect(errorRedirectUrl.toString());
  }
}
