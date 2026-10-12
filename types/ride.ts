/**
 * @file types/ride.ts
 * @description Ride Lifecycle and Driver/Customer Domain Types.
 * 
 * Defines all ride-related types including status states, database records,
 * query responses, and driver dashboard analytics structures.
 */

/**
 * State machine for a ride lifecycle in the database:
 * 1. 'requested'   - Customer created the ride request; waiting for a driver.
 * 2. 'accepted'    - A driver has claimed and confirmed the ride request.
 * 3. 'in_progress' - Driver has picked up customer; trip is underway.
 * 4. 'completed'   - Trip concluded successfully and fare is finalized.
 */
export const RIDE_STATUSES = [
  "requested",
  "accepted",
  "in_progress",
  "completed",
] as const;

export type RideStatus = (typeof RIDE_STATUSES)[number];

/**
 * Clean, client-friendly representation of a ride summary.
 * All numeric values (lat, lng, distance, fare) are guaranteed numbers.
 */
export interface RideSummary {
  id: string;
  status: RideStatus;
  pickupLocation: string;
  destinationLocation: string;
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  estimatedDurationMinutes: number;
  fare: number;
  currency: string;
  pin?: string;
  completedAt?: string | null;
  createdAt: string;
}


/**
 * Parameters required to create a new ride record in the database.
 */
export interface CreateRideInput {
  customerId: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  destinationLocation: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm: number;
  estimatedDurationMinutes: number;
  fare: number;
  pricePerKmSnapshot: number;
  currency: string;
}

/**
 * Result structure returned when creating a ride.
 */
export type CreateRideResult =
  | { ok: true; data: RideSummary }
  | { ok: false; error: "db_error"; details?: unknown };

/**
 * Result structure for single ride queries.
 */
export type GetRideResult =
  | { ok: true; data: RideSummary }
  | { ok: false; error: "not_found" | "db_error"; details?: unknown };

/**
 * Shape of the ride record formatted for driver dashboard screens.
 */
export interface DriverRideRow {
  id: string;
  customer_id: string;
  driver_id: string | null;
  pickup_location: string;
  destination_location: string;
  pickup_lat: number;
  pickup_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance_km: number;
  estimated_duration_minutes: number;
  fare: number;
  currency: string;
  status: string;
  pin?: string;
  accepted_at: string | null;

  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  rider_name?: string | null;
  rider_phone?: string | null;
}

/**
 * Safe public driver profile representation (password excluded).
 */
export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  vehicle_info: unknown;
  created_at: string;
}

/**
 * Aggregated analytics metrics for the driver's overview panel.
 */
export interface DriverStats {
  availableRides: number;
  activeRides: number;
  completedRides: number;
  totalEarnings: number;
}

/**
 * Generic result format for asynchronous mutation actions.
 */
export type ActionResult =
  | { success: true; error: null }
  | { success: false; error: string };

/**
 * Server action return state for ride requests.
 */
export type RideRequestFormState =
  | {
      errors?: {
        pickupLocation?: string[];
        pickupLat?: string[];
        pickupLng?: string[];
        destinationLocation?: string[];
        destinationLat?: string[];
        destinationLng?: string[];
      };
      message?: string;
      ride?: RideSummary;
    }
  | undefined;

/**
 * Input for updating driver vehicle specifications.
 */
export interface VehicleInfoInput {
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
}
