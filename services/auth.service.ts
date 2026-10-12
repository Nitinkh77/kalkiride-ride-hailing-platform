/**
 * @file services/auth.service.ts
 * @description Authentication and Session Management Service.
 * 
 * Provides industry-standard security practices:
 * 1. Passwords hashed using bcrypt with salt rounds before database persistence.
 * 2. Sessions signed with JSON Web Tokens (HS256) and stored in HTTP-only, SameSite cookies.
 * 3. User credentials verified against database records.
 * 4. Error handling with duplicate key classification (PostgreSQL error 23505).
 */

import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import type { UserRole, SessionPayload, VehicleInfo } from "@/types";

const SALT_ROUNDS = 10;
const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_DURATION_JWT = "7d";

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET is not defined. Add it to .env.local before starting the app."
  );
}

const encodedKey = new TextEncoder().encode(SESSION_SECRET);

/**
 * Hashes a plain-text password using bcrypt.
 * 
 * @param {string} password - Raw password entered by the user.
 * @returns {Promise<string>} Secure salted hash suitable for database storage.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("hashPassword: password is required");
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password with an existing bcrypt password hash.
 * 
 * @param {string} password - Raw password to test.
 * @param {string} passwordHash - Stored hash from the database.
 * @returns {Promise<boolean>} True if the password matches, false otherwise.
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  if (!password || !passwordHash) {
    return false;
  }
  return bcrypt.compare(password, passwordHash);
}

/**
 * Signs a JWT session payload using HS256 algorithm.
 * 
 * @param {SessionPayload} payload - User session data (userId, role, expiresAt).
 * @returns {Promise<string>} Signed JWT string.
 */
export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION_JWT)
    .sign(encodedKey);
}

/**
 * Decrypts and verifies a JWT session token.
 * 
 * @param {string | undefined} token - JWT string from the incoming cookie.
 * @returns {Promise<SessionPayload | null>} Validated payload or null if invalid/expired.
 */
export async function decryptSession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Creates an authenticated session for a user and sets an HTTP-only cookie.
 * 
 * Security Features:
 * - `httpOnly`: Prevents client-side JavaScript from accessing the cookie (XSS protection).
 * - `secure`: Enforced in production to ensure transmission over HTTPS only.
 * - `sameSite: 'lax'`: Mitigates Cross-Site Request Forgery (CSRF).
 * 
 * @param {string} userId - Database ID of the user.
 * @param {UserRole} role - Role of the user ('customer' | 'driver').
 */
export async function createSession(
  userId: string,
  role: UserRole
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encryptSession({
    userId,
    role,
    expiresAt: expiresAt.toISOString(),
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Reads the current request's session cookie and validates the JWT payload.
 * 
 * @returns {Promise<SessionPayload | null>} The active user session or null if unauthenticated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decryptSession(token);
}

/**
 * Destroys the current user session by deleting the session cookie.
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Helper to identify PostgreSQL unique constraint violation (error code 23505).
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

/**
 * Detects whether a database conflict occurred on email or phone field.
 */
export function detectDuplicateField(
  error: { details?: string | null; message?: string }
): "email" | "phone" | null {
  const haystack =
    `${error.details ?? ""} ${error.message ?? ""}`.toLowerCase();

  if (haystack.includes("email")) return "email";
  if (haystack.includes("phone")) return "phone";

  return null;
}

/**
 * Registers a new user account in Supabase.
 * 
 * @param {object} input - Registration details.
 * @returns {Promise<{ ok: true; user: { id: string; role: UserRole } } | { ok: false; error: string; field?: "email" | "phone" }>}
 */
export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  vehicleInfo?: VehicleInfo;
}) {
  const passwordHash = await hashPassword(input.password);

  const { data, error } = await supabase
    .from("users")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      password_hash: passwordHash,
      role: input.role,
      vehicle_info: input.role === "driver" ? input.vehicleInfo : null,
    })
    .select("id, role")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      const field = detectDuplicateField(error);
      if (field === "email") {
        return { ok: false as const, error: "An account with this email already exists.", field: "email" as const };
      }
      if (field === "phone") {
        return { ok: false as const, error: "An account with this phone number already exists.", field: "phone" as const };
      }
      return { ok: false as const, error: "An account with these details already exists." };
    }
    console.error("[auth.service] Registration error:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }

  return { ok: true as const, user: data as { id: string; role: UserRole } };
}

/**
 * Authenticates user credentials against the database.
 * 
 * @param {string} email - User email address.
 * @param {string} password - Raw password to check.
 * @returns {Promise<{ ok: true; user: { id: string; role: UserRole } } | { ok: false; error: string }>}
 */
export async function authenticateUser(email: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, role, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[auth.service] Database query error during login:", error);
    return { ok: false as const, error: "Something went wrong. Please try again." };
  }

  if (!data) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  const isPasswordValid = await verifyPassword(password, data.password_hash);
  if (!isPasswordValid) {
    return { ok: false as const, error: "Invalid email or password." };
  }

  return {
    ok: true as const,
    user: {
      id: String(data.id),
      role: data.role as UserRole,
    },
  };
}

/**
 * Finds an existing user by email or registers a new customer account via Google OAuth.
 * 
 * @param {object} input - Google user identity details.
 * @returns {Promise<{ ok: true; user: { id: string; role: UserRole } } | { ok: false; error: string }>}
 */
export async function findOrCreateGoogleUser(input: {
  email: string;
  name: string;
  role?: UserRole;
}): Promise<{ ok: true; user: { id: string; role: UserRole } } | { ok: false; error: string }> {
  const email = input.email.toLowerCase().trim();

  // 1. Check if user already exists
  const { data: existingUser, error: queryError } = await supabase
    .from("users")
    .select("id, role, email")
    .eq("email", email)
    .maybeSingle();

  if (queryError) {
    console.error("[auth.service] Database query error in findOrCreateGoogleUser:", queryError);
    return { ok: false, error: "Database error while verifying account." };
  }

  if (existingUser) {
    return {
      ok: true,
      user: {
        id: String(existingUser.id),
        role: existingUser.role as UserRole,
      },
    };
  }

  // 2. User does not exist -> create new user account
  const passwordHash = await hashPassword(crypto.randomUUID());
  const role = input.role || "customer";

  // Attempt insert with phone: null first; fallback to empty string if NOT NULL constraint exists
  let insertResult = await supabase
    .from("users")
    .insert({
      name: input.name || "Google User",
      email,
      phone: null,
      password_hash: passwordHash,
      role,
      vehicle_info: role === "driver" ? {} : null,
    })
    .select("id, role")
    .single();

  if (insertResult.error) {
    console.warn("[auth.service] Insert with null phone failed, trying empty string fallback:", insertResult.error.message);
    insertResult = await supabase
      .from("users")
      .insert({
        name: input.name || "Google User",
        email,
        phone: "",
        password_hash: passwordHash,
        role,
        vehicle_info: role === "driver" ? {} : null,
      })
      .select("id, role")
      .single();
  }

  if (insertResult.error) {
    console.error("[auth.service] Failed to create Google OAuth user in database:", insertResult.error);
    return { ok: false, error: "Failed to create user account from Google login." };
  }

  return {
    ok: true,
    user: {
      id: String(insertResult.data.id),
      role: insertResult.data.role as UserRole,
    },
  };
}

