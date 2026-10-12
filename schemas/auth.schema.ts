/**
 * @file schemas/auth.schema.ts
 * @description Zod Validation Schemas for Authentication and User Registration.
 * 
 * In production industry architectures, validation schemas are separated from
 * database models and UI components to:
 * 1. Allow single source of truth for form/API input verification.
 * 2. Prevent malicious or invalid payloads before reaching business logic or SQL.
 * 3. Provide typed error messages directly to the UI layer.
 */

import * as z from "zod";

/**
 * Validation schema for new user registrations (Customer or Driver).
 * 
 * Rules applied:
 * - name: String, trimmed, min 2 characters.
 * - email: Valid email format, trimmed, lowercase.
 * - phone: Min 7 digits, digits/plus/dash allowed.
 * - password: Min 8 chars, at least 1 letter and 1 number.
 * - role: Must be either "customer" or "driver".
 * - vehicleInfo: Conditionally validated; required if role === "driver".
 */
export const SignupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters long." }),
    email: z
      .email({ error: "Please enter a valid email." })
      .trim()
      .toLowerCase(),
    phone: z
      .string()
      .trim()
      .min(7, { error: "Phone must be at least 7 characters long." })
      .regex(/^[0-9+\-\s]+$/, {
        error: "Phone can only contain digits, spaces, +, and -.",
      }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters long." })
      .regex(/[a-zA-Z]/, {
        error: "Password must contain at least one letter.",
      })
      .regex(/[0-9]/, {
        error: "Password must contain at least one number.",
      }),
    role: z.enum(["customer", "driver"], {
      error: "Role must be either 'customer' or 'driver'.",
    }),
    vehicleInfo: z
      .object({
        make: z.string().trim().optional(),
        model: z.string().trim().optional(),
        year: z.coerce.number().int().min(1900).max(2100).optional(),
        plateNumber: z.string().trim().optional(),
        color: z.string().trim().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If the registered role is a driver, enforce vehicle specification fields
    if (data.role !== "driver") return;

    if (!data.vehicleInfo) {
      ctx.addIssue({
        code: "custom",
        message: "Vehicle information is required for drivers.",
        path: ["vehicleInfo"],
      });
      return;
    }

    if (!data.vehicleInfo.make) {
      ctx.addIssue({
        code: "custom",
        message: "Vehicle make is required for drivers.",
        path: ["vehicleInfo", "make"],
      });
    }
    if (!data.vehicleInfo.model) {
      ctx.addIssue({
        code: "custom",
        message: "Vehicle model is required for drivers.",
        path: ["vehicleInfo", "model"],
      });
    }
    if (!data.vehicleInfo.plateNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Vehicle plate number is required for drivers.",
        path: ["vehicleInfo", "plateNumber"],
      });
    }
  });

export type SignupInput = z.infer<typeof SignupSchema>;

/**
 * Validation schema for User Login credentials.
 * 
 * Rules applied:
 * - email: Valid email address format, lowercase.
 * - password: Non-empty string.
 */
export const LoginSchema = z.object({
  email: z
    .email({ error: "Please enter a valid email." })
    .trim()
    .toLowerCase(),
  password: z.string().min(1, { error: "Password is required." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;
