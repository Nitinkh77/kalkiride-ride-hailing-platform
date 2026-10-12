/**
 * @file app/actions/auth.ts
 * @description Next.js Server Actions for Authentication (Signup & Login).
 * 
 * Industry Role: Controller Layer.
 * Responsibilities:
 * 1. Receive and parse FormData from the client.
 * 2. Validate payload against Zod schemas from `@/schemas`.
 * 3. Invoke business logic in `@/services/auth.service`.
 * 4. Issue HTTP session cookies upon successful authentication.
 * 5. Handle role-based redirects (`/dashboard/customer` vs `/dashboard/driver`).
 */

"use server";

import { redirect } from "next/navigation";
import { SignupSchema, LoginSchema } from "@/schemas";
import {
  registerUser,
  authenticateUser,
  createSession,
} from "@/services/auth.service";
import type { SignupFormState, LoginFormState } from "@/types";

/**
 * Server action handling user registration.
 * 
 * Flow:
 * 1. Extract form fields from FormData.
 * 2. Run Zod validation (`SignupSchema.safeParse`).
 *    - If invalid: return field-level errors to the UI immediately.
 * 3. Call `registerUser` in the authentication service layer.
 * 4. On success: redirect the newly registered user to the login screen.
 * 
 * @param {SignupFormState} _prevState - Previous form state from React `useActionState`.
 * @param {FormData} formData - Raw browser form data submitted by user.
 * @returns {Promise<SignupFormState>} Errors object or triggers Next.js redirect.
 */
export async function signup(
  _prevState: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const rawRole = formData.get("role");
  const isDriver = rawRole === "driver";

  // 1. Gather raw form fields
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: rawRole,
    vehicleInfo: isDriver
      ? {
          make: formData.get("vehicleMake"),
          model: formData.get("vehicleModel"),
          year: formData.get("vehicleYear") || undefined,
          plateNumber: formData.get("vehiclePlateNumber"),
          color: formData.get("vehicleColor"),
        }
      : undefined,
  };

  // 2. Validate against schema
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // 3. Delegate to service layer
  const result = await registerUser(parsed.data);
  if (!result.ok) {
    if (result.field === "email") {
      return { errors: { email: [result.error] } };
    }
    if (result.field === "phone") {
      return { errors: { phone: [result.error] } };
    }
    return { message: result.error };
  }

  // 4. Role-based redirect upon successful account creation
  const redirectTo = formData.get("redirectTo");
  if (typeof redirectTo === "string" && redirectTo.length > 0 && redirectTo !== "/") {
    redirect(redirectTo);
  }

  redirect(
    result.user.role === "customer"
      ? "/ride-details"
      : "/dashboard/driver"
  );
}

/**
 * Server action handling user login.
 * 
 * Flow:
 * 1. Extract email and password from FormData.
 * 2. Run Zod validation (`LoginSchema.safeParse`).
 * 3. Call `authenticateUser` in the auth service layer to verify password hash.
 * 4. Create an encrypted HTTP-only session cookie (`createSession`).
 * 5. Redirect user to their corresponding role dashboard.
 * 
 * @param {LoginFormState} _prevState - Previous form state from React `useActionState`.
 * @param {FormData} formData - Form submission containing email and password.
 * @returns {Promise<LoginFormState>} Errors object or triggers Next.js redirect.
 */
export async function login(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // 1. Validate credentials format
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;
  const redirectTo = formData.get("redirectTo");

  // 2. Authenticate through the service layer
  const authResult = await authenticateUser(email, password);
  if (!authResult.ok) {
    return { message: authResult.error };
  }

  // 3. Establish secure session
  await createSession(authResult.user.id, authResult.user.role);

  // 4. Navigate to redirect target or dashboard
  if (typeof redirectTo === "string" && redirectTo.length > 0 && redirectTo !== "/") {
    redirect(redirectTo);
  }

  redirect(
    authResult.user.role === "driver"
      ? "/dashboard/driver"
      : "/ride-details"
  );
}