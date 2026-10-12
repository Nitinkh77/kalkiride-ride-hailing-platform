/**
 * @file schemas/ride.schema.ts
 * @description Zod Validation Schemas for Ride Requests and Location Bounds.
 * 
 * Verifies that coordinates and address texts submitted by users fall within
 * valid geographic bounds before any routing, distance, or database queries run.
 */

import * as z from "zod";

/**
 * Validation schema for a customer ride booking request.
 * 
 * Ensures:
 * - pickupLocation & destinationLocation are non-empty strings up to 500 characters.
 * - Latitudes are strictly bounded between -90 and 90 degrees.
 * - Longitudes are strictly bounded between -180 and 180 degrees.
 */
export const RideRequestSchema = z.object({
  pickupLocation: z
    .string()
    .trim()
    .min(1, { error: "Pickup location is required." })
    .max(500, { error: "Pickup location is too long." }),

  pickupLat: z.coerce
    .number({ error: "Pickup latitude is required." })
    .min(-90, { error: "Pickup latitude must be between -90 and 90." })
    .max(90, { error: "Pickup latitude must be between -90 and 90." }),

  pickupLng: z.coerce
    .number({ error: "Pickup longitude is required." })
    .min(-180, { error: "Pickup longitude must be between -180 and 180." })
    .max(180, { error: "Pickup longitude must be between -180 and 180." }),

  destinationLocation: z
    .string()
    .trim()
    .min(1, { error: "Destination is required." })
    .max(500, { error: "Destination is too long." }),

  destinationLat: z.coerce
    .number({ error: "Destination latitude is required." })
    .min(-90, { error: "Destination latitude must be between -90 and 90." })
    .max(90, { error: "Destination latitude must be between -90 and 90." }),

  destinationLng: z.coerce
    .number({ error: "Destination longitude is required." })
    .min(-180, { error: "Destination longitude must be between -180 and 180." })
    .max(180, { error: "Destination longitude must be between -180 and 180." }),
});

export type RideRequestInput = z.infer<typeof RideRequestSchema>;
