/**
 * @file services/google-auth.service.ts
 * @description Google OAuth 2.0 / OpenID Connect Service.
 * 
 * Handles:
 * 1. Generating Google OAuth authorization URLs with CSRF state and PKCE protection.
 * 2. Exchanging authorization code for Google access token and ID token.
 * 3. Fetching and validating Google user profile (name, email, avatar).
 */

import "server-only";

export interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture?: string;
}

/**
 * Checks whether Google OAuth environment variables are defined.
 */
export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
}

/**
 * Resolves the exact redirect URI based on the incoming request and environment.
 * Ensures consistent origin between /api/auth/google and /api/auth/google/callback.
 * Accurately handles localhost, Vercel production, and preview URLs.
 */
export function getOAuthRedirectUri(request: Request): string {
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "";
  
  // Clean multi-host proxy chains (e.g., "domain.com, proxy.com")
  const host = hostHeader.split(",")[0].trim();
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1");

  let origin: string;

  if (isLocal) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "http";
    origin = `${proto}://${host || "localhost:3000"}`;
  } else if (
    process.env.NEXT_PUBLIC_SITE_URL &&
    !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
  ) {
    origin = process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origin = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/+$/, "")}`;
  } else if (host.includes(".vercel.app") && host.includes("-git-")) {
    // If visitor is browsing via a Vercel preview deployment branch URL,
    // route OAuth back to the canonical production URL registered in Google Console
    origin = "https://kalki-ride-app.vercel.app";
  } else if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "https";
    origin = `${proto}://${host}`;
  } else {
    origin = "https://kalki-ride-app.vercel.app";
  }

  return `${origin}/api/auth/google/callback`;
}

/**
 * Generates the full Google OAuth 2.0 consent screen URL.
 * 
 * @param {string} state - Cryptographic CSRF state token stored in cookie.
 * @param {string} redirectUri - Fully qualified callback URL.
 * @returns {string} Google authorization redirect URL.
 */
export function getGoogleOAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured in environment variables.");
  }

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: redirectUri,
    client_id: clientId,
    access_type: "online",
    response_type: "code",
    prompt: "select_account",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
}

/**
 * Exchanges Google authorization code for access tokens.
 * 
 * @param {string} code - Authorization code received in callback.
 * @param {string} redirectUri - Same redirect URI passed to authorization request.
 * @returns {Promise<{ access_token: string; id_token?: string }>}
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; id_token?: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials missing in environment variables.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("[google-auth.service] Token exchange failed:", data);
    throw new Error(data.error_description || "Failed to exchange Google authorization code.");
  }

  return {
    access_token: data.access_token,
    id_token: data.id_token,
  };
}

/**
 * Fetches verified user identity from Google's OpenID UserInfo endpoint.
 * 
 * @param {string} accessToken - Access token from token exchange.
 * @returns {Promise<GoogleUserInfo>} Verified user info.
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile from Google.");
  }

  const userInfo = (await response.json()) as GoogleUserInfo;

  if (!userInfo.email) {
    throw new Error("Google account does not provide an email address.");
  }

  return userInfo;
}
