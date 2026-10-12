/**
 * @file types/auth.ts
 * @description Authentication and User Type Definitions.
 * 
 * This file contains pure TypeScript definitions for authentication, user roles,
 * form state validation messages, and encrypted session payloads.
 * Keeping types separate from runtime code ensures lightweight imports across
 * both server-side and client-side modules.
 */

/**
 * List of supported user roles in the KalkiRide platform.
 * - 'customer': Riders who search and book trips.
 * - 'driver': Drivers who accept and fulfill rides.
 */
export const USER_ROLES = ["customer", "driver"] as const;

/**
 * Union type representing valid user roles: 'customer' | 'driver'.
 */
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Type definition for vehicle information associated with a driver.
 */
export interface VehicleInfo {
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  color?: string;
}

/**
 * Represents a registered user in the KalkiRide database.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  vehicle_info?: VehicleInfo | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Return state for the Signup form action.
 * Contains field-specific validation errors or a general message.
 */
export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        phone?: string[];
        password?: string[];
        role?: string[];
        vehicleInfo?: string[];
      };
      message?: string;
    }
  | undefined;

/**
 * Return state for the Login form action.
 * Contains email/password error lists or an invalid credentials message.
 */
export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

/**
 * Encrypted payload stored inside the HTTP-only JWT session cookie.
 */
export type SessionPayload = {
  /** Unique ID of the authenticated user in Supabase */
  userId: string;
  /** Role determining permissions ('customer' or 'driver') */
  role: UserRole;
  /** ISO timestamp string when the session expires */
  expiresAt: string;
};
