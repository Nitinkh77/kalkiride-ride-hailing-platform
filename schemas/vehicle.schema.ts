/**
 * @file schemas/vehicle.schema.ts
 * @description Zod Validation Schema for Driver Vehicle Updates.
 */

import * as z from "zod";

/**
 * Validation schema for updating driver vehicle profile details.
 */
export const VehicleInfoSchema = z.object({
  make: z.string().trim().min(1, { error: "Make is required." }),
  model: z.string().trim().min(1, { error: "Model is required." }),
  year: z.coerce
    .number({ error: "Valid year is required." })
    .int()
    .min(1900, { error: "Year must be 1900 or later." })
    .max(2100, { error: "Year is invalid." }),
  plateNumber: z
    .string()
    .trim()
    .min(1, { error: "Plate number is required." })
    .toUpperCase(),
  color: z.string().trim().min(1, { error: "Color is required." }),
});

export type VehicleInfoValidation = z.infer<typeof VehicleInfoSchema>;
