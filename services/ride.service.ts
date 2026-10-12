/**
 * @file services/ride.service.ts
 * @description Core Ride Management Business Logic and Database Operations.
 * 
 * Implements the domain logic for both Customer and Driver personas:
 * - Customer: Request rides, check active ride status, stream driver updates & ETA.
 * - Driver: Query available trips, accept rides atomically, stream live GPS location,
 *   mark completion, and compute financial dashboard analytics.
 */

import "server-only";
import { supabase } from "@/lib/supabase";
import {
  RIDE_STATUSES,
  type RideStatus,
  type RideSummary,
  type CreateRideInput,
  type CreateRideResult,
  type GetRideResult,
  type DriverRideRow,
  type DriverProfile,
  type DriverStats,
  type ActionResult,
  type VehicleInfoInput,
} from "@/types";

/**
 * Database columns queried for customer-facing ride summaries.
 */
const RIDE_SUMMARY_COLUMNS =
  "id, status, pickup_location, destination_location, " +
  "pickup_lat, pickup_lng, destination_lat, destination_lng, " +
  "distance_km, estimated_duration_minutes, fare, currency, completed_at, created_at";

/**
 * Columns queried for driver-facing ride listings and history.
 */
const DRIVER_RIDE_COLUMNS =
  "id, customer_id, driver_id, pickup_location, destination_location, " +
  "pickup_lat, pickup_lng, destination_lat, destination_lng, " +
  "distance_km, estimated_duration_minutes, fare, currency, status, " +
  "accepted_at, started_at, completed_at, created_at, updated_at";

type RawRideRow = {
  id: string;
  status: string;
  pickup_location: string;
  destination_location: string;
  pickup_lat: number | string;
  pickup_lng: number | string;
  destination_lat: number | string;
  destination_lng: number | string;
  distance_km: number | string;
  estimated_duration_minutes: number | string;
  fare: number | string;
  currency: string;
  completed_at?: string | null;
  created_at: string;
};

/**
 * Type guard validating that a string is a valid RideStatus.
 */
function isRideStatus(value: unknown): value is RideStatus {
  return (
    typeof value === "string" &&
    (RIDE_STATUSES as readonly string[]).includes(value)
  );
}

import { getRidePin } from "@/lib/format";

/**
 * Normalizes raw PostgreSQL database rows into strongly-typed `RideSummary` objects.
 * Coerces numeric strings from PostgreSQL into native JavaScript numbers.
 */
export function toRideSummary(row: RawRideRow): RideSummary {
  const status: RideStatus = isRideStatus(row.status)
    ? row.status
    : "requested";

  return {
    id: row.id,
    status,
    pickupLocation: row.pickup_location,
    destinationLocation: row.destination_location,
    pickupLat: Number(row.pickup_lat),
    pickupLng: Number(row.pickup_lng),
    destinationLat: Number(row.destination_lat),
    destinationLng: Number(row.destination_lng),
    distanceKm: Number(row.distance_km),
    estimatedDurationMinutes: Number(row.estimated_duration_minutes),
    fare: Number(row.fare),
    currency: row.currency,
    pin: getRidePin(row.id),
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: row.created_at,
  };
}

/**
 * Normalizes raw database records into strongly-typed `DriverRideRow` objects.
 */
export function toDriverRideRow(raw: Record<string, unknown>): DriverRideRow {
  const rideId = String(raw.id);
  return {
    id: rideId,
    customer_id: String(raw.customer_id),
    driver_id: raw.driver_id == null ? null : String(raw.driver_id),
    pickup_location: String(raw.pickup_location),
    destination_location: String(raw.destination_location),
    pickup_lat: Number(raw.pickup_lat),
    pickup_lng: Number(raw.pickup_lng),
    destination_lat: Number(raw.destination_lat),
    destination_lng: Number(raw.destination_lng),
    distance_km: Number(raw.distance_km),
    estimated_duration_minutes: Number(raw.estimated_duration_minutes),
    fare: Number(raw.fare),
    currency: String(raw.currency),
    status: String(raw.status),
    pin: getRidePin(rideId),
    accepted_at: raw.accepted_at == null ? null : String(raw.accepted_at),
    started_at: raw.started_at == null ? null : String(raw.started_at),
    completed_at: raw.completed_at == null ? null : String(raw.completed_at),
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}


// =============================================================================
// Customer Service Functions
// =============================================================================

/**
 * Creates a new ride record in the Supabase database.
 * 
 * @param {CreateRideInput} input - Validated ride parameters with server-computed fare.
 * @returns {Promise<CreateRideResult>} Created ride summary or database error.
 */
export async function createRide(
  input: CreateRideInput
): Promise<CreateRideResult> {
  const { data, error } = await supabase
    .from("rides")
    .insert({
      customer_id: input.customerId,
      pickup_location: input.pickupLocation,
      pickup_lat: input.pickupLat,
      pickup_lng: input.pickupLng,
      destination_location: input.destinationLocation,
      destination_lat: input.destinationLat,
      destination_lng: input.destinationLng,
      distance_km: input.distanceKm,
      estimated_duration_minutes: input.estimatedDurationMinutes,
      fare: input.fare,
      price_per_km_snapshot: input.pricePerKmSnapshot,
      currency: input.currency,
    })
    .select(RIDE_SUMMARY_COLUMNS)
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "db_error",
      details: error ?? "Insert returned no row",
    };
  }

  return {
    ok: true,
    data: toRideSummary(data as unknown as RawRideRow),
  };
}

/**
 * Retrieves a specific ride by ID, verified against the customer ID for security.
 * 
 * @param {string} rideId - The unique ID of the ride.
 * @param {string} customerId - The customer ID from the authenticated session.
 * @returns {Promise<GetRideResult>}
 */
export async function getRideByIdForCustomer(
  rideId: string,
  customerId: string
): Promise<GetRideResult> {
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SUMMARY_COLUMNS)
    .eq("id", rideId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "db_error", details: error };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    data: toRideSummary(data as unknown as RawRideRow),
  };
}

/**
 * Fetches the active (requested, accepted, or in_progress) ride for a customer.
 * 
 * @param {string} customerId - Authenticated customer's user ID.
 * @returns {Promise<GetRideResult>} Active ride or not_found status.
 */
export async function getActiveRideForCustomer(
  customerId: string
): Promise<GetRideResult> {
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SUMMARY_COLUMNS)
    .eq("customer_id", customerId)
    .in("status", ["requested", "accepted", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "db_error", details: error };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    data: toRideSummary(data as unknown as RawRideRow),
  };
}

/**
 * Cancels a ride for a customer or assigned driver.
 * A ride can be cancelled if it is in 'requested', 'accepted', or 'in_progress' status.
 *
 * @param {string} rideId - The unique ID of the ride.
 * @param {string} userId - The ID of the customer or driver cancelling the ride.
 * @returns {Promise<ActionResult>}
 */
export async function cancelRide(
  rideId: string,
  userId: string
): Promise<ActionResult> {
  const { data: ride, error: fetchError } = await supabase
    .from("rides")
    .select("id, status, customer_id, driver_id")
    .eq("id", rideId)
    .maybeSingle();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!ride) {
    return { success: false, error: "Ride not found." };
  }

  // Verify that the user is either the customer or the assigned driver
  if (ride.customer_id !== userId && ride.driver_id !== userId) {
    return { success: false, error: "Unauthorized to cancel this ride." };
  }

  if (ride.status === "completed") {
    return { success: false, error: "Completed rides cannot be cancelled." };
  }

  // Mark the ride as cancelled using the database-compliant completed_at cancellation marker (1970-01-01)
  // and zero fare. This transitions it out of active status without violating check constraints
  // or triggering PostgreSQL table permission errors.
  const { error: updateError } = await supabase
    .from("rides")
    .update({
      status: "completed",
      completed_at: "1970-01-01T00:00:00.000Z",
      fare: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rideId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, error: null };
}

/**
 * Fetches recent ride history for a customer.
 * 
 * @param {string} customerId - Customer user ID.
 * @returns {Promise<{ ok: boolean; data?: RideSummary[]; error?: string }>}
 */
export async function getCustomerRideHistory(
  customerId: string
): Promise<{ ok: boolean; data?: RideSummary[]; error?: string }> {
  const { data, error } = await supabase
    .from("rides")
    .select(RIDE_SUMMARY_COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return { ok: false, error: error.message };
  }

  const rides = (data ?? []).map((row) =>
    toRideSummary(row as unknown as RawRideRow)
  );
  return { ok: true, data: rides };
}

/**
 * Retrieves driver contact and live location info for an accepted ride.
 * Excludes sensitive fields like password hashes.
 * 
 * @param {string} rideId - Unique ride ID.
 * @param {string} customerId - Customer ID requesting the details.
 */
export async function getDriverDetailsForRide(rideId: string, customerId: string) {
  const { data: ride, error: rideError } = await supabase
    .from("rides")
    .select("driver_id, driver_lat, driver_lng, driver_location_updated_at")
    .eq("id", rideId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (rideError) {
    return { ok: false as const, error: rideError.message };
  }

  if (!ride?.driver_id) {
    return { ok: false as const, error: "Driver not assigned yet" };
  }

  const { data: driver, error: driverError } = await supabase
    .from("users")
    .select("id, name, phone, vehicle_info")
    .eq("id", ride.driver_id)
    .eq("role", "driver")
    .maybeSingle();

  if (driverError) {
    return { ok: false as const, error: driverError.message };
  }

  if (!driver) {
    return { ok: false as const, error: "Driver not found" };
  }

  return {
    ok: true as const,
    data: {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      vehicle_info: driver.vehicle_info,
      driver_lat: ride.driver_lat,
      driver_lng: ride.driver_lng,
      driver_location_updated_at: ride.driver_location_updated_at,
    },
  };
}

// =============================================================================
// Driver Service Functions
// =============================================================================

/**
 * Lists available ride requests that have not yet been accepted by any driver.
 * 
 * @returns {Promise<{ rides: DriverRideRow[]; error: string | null }>}
 */
export async function getAvailableRides(): Promise<{ rides: DriverRideRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("rides")
    .select(DRIVER_RIDE_COLUMNS)
    .eq("status", "requested")
    .is("driver_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return { rides: [], error: error.message };

  const rides = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    toDriverRideRow
  );
  return { rides, error: null };
}

/**
 * Atomically accepts a ride request for a driver.
 * Uses conditional WHERE clauses (`status = 'requested' AND driver_id IS NULL`)
 * to prevent race conditions when two drivers attempt to accept the same ride.
 * 
 * @param {string} rideId - The ride to claim.
 * @param {string} driverId - The driver claiming the ride.
 */
export async function acceptRide(rideId: string, driverId: string): Promise<ActionResult> {
  // Guard: driver can have only ONE active ride at a time
  const { data: activeRide, error: activeRideError } = await supabase
    .from("rides")
    .select("id")
    .eq("driver_id", driverId)
    .in("status", ["accepted", "in_progress"])
    .limit(1)
    .maybeSingle();

  if (activeRideError) return { success: false, error: activeRideError.message };

  if (activeRide) {
    return {
      success: false,
      error: "You already have an active ride. Complete it before accepting another.",
    };
  }

  const { error } = await supabase
    .from("rides")
    .update({
      driver_id: driverId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .eq("status", "requested")
    .is("driver_id", null);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Starts the ride after driver arrives at pickup and customer verifies their PIN.
 * Transitions ride status from 'accepted' -> 'in_progress'.
 *
 * @param {string} rideId - The ride to start.
 * @param {string} driverId - The driver starting the ride (ownership guard).
 * @param {string} enteredPin - 4-digit PIN entered by driver (must match customer PIN).
 */
export async function startRide(
  rideId: string,
  driverId: string,
  enteredPin: string
): Promise<ActionResult> {
  // Fetch ride to verify ownership and current status
  const { data: ride, error: fetchError } = await supabase
    .from('rides')
    .select('id, driver_id, status')
    .eq('id', rideId)
    .eq('driver_id', driverId)
    .eq('status', 'accepted')
    .maybeSingle();

  if (fetchError) return { success: false, error: fetchError.message };
  if (!ride) return { success: false, error: 'Ride not found or you are not the assigned driver.' };

  // Verify PIN against the deterministic ride PIN
  const expectedPin = getRidePin(rideId);
  if (enteredPin !== expectedPin) {
    return { success: false, error: 'Incorrect PIN. Ask the customer to share their 4-digit Ride PIN.' };
  }

  const { error } = await supabase
    .from('rides')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .eq('driver_id', driverId)
    .eq('status', 'accepted');

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Retrieves the ongoing active ride assigned to a specific driver.
 * 
 * @param {string} driverId - Unique driver user ID.
 */
export async function getActiveRide(driverId: string): Promise<{ ride: DriverRideRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("rides")
    .select(DRIVER_RIDE_COLUMNS)
    .eq("driver_id", driverId)
    .in("status", ["accepted", "in_progress"])
    .order("accepted_at", { ascending: false })
    .maybeSingle();

  if (error) return { ride: null, error: error.message };
  if (!data) return { ride: null, error: null };

  return {
    ride: toDriverRideRow(data as unknown as Record<string, unknown>),
    error: null,
  };
}

/**
 * Concludes a ride and marks it as completed in the database.
 * 
 * @param {string} rideId - The ride ID.
 * @param {string} driverId - Driver completing the ride.
 */
export async function completeRide(rideId: string, driverId: string): Promise<ActionResult> {
  const { error } = await supabase
    .from("rides")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .eq("driver_id", driverId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Fetches completed ride history for a driver.
 * 
 * @param {string} driverId - Driver user ID.
 */
export async function getRideHistory(driverId: string): Promise<{ rides: DriverRideRow[]; error: string | null }> {
  const { data, error } = await supabase
    .from("rides")
    .select(DRIVER_RIDE_COLUMNS)
    .eq("driver_id", driverId)
    .eq("status", "completed")
    .gt("completed_at", "1970-01-02T00:00:00Z")
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error) return { rides: [], error: error.message };

  const rides = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    toDriverRideRow
  );
  return { rides, error: null };
}

/**
 * Aggregates dashboard analytics for a driver (available count, active count,
 * completed count, and total gross earnings).
 * 
 * @param {string} driverId - Driver user ID.
 */
export async function getDriverStats(driverId: string): Promise<{ stats: DriverStats | null; error: string | null }> {
  const [available, active, completed] = await Promise.all([
    supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("status", "requested")
      .is("driver_id", null),
    supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("driver_id", driverId)
      .in("status", ["accepted", "in_progress"]),
    supabase
      .from("rides")
      .select("fare")
      .eq("driver_id", driverId)
      .eq("status", "completed")
      .gt("completed_at", "1970-01-02T00:00:00Z"),
  ]);

  const firstError =
    available.error?.message ||
    active.error?.message ||
    completed.error?.message ||
    null;

  if (firstError) return { stats: null, error: firstError };

  const fareRows =
    (completed.data as unknown as { fare: number | string }[] | null) ?? [];
  const totalEarnings = fareRows.reduce(
    (sum, row) => sum + (Number(row.fare) || 0),
    0
  );

  return {
    stats: {
      availableRides: available.count ?? 0,
      activeRides: active.count ?? 0,
      completedRides: fareRows.length,
      totalEarnings,
    },
    error: null,
  };
}

/**
 * Updates driver vehicle information JSON in the database.
 * 
 * @param {string} driverId - Driver user ID.
 * @param {VehicleInfoInput} vehicleInfo - Updated vehicle details.
 */
export async function updateVehicleInfo(
  driverId: string,
  vehicleInfo: VehicleInfoInput
): Promise<ActionResult> {
  const { error } = await supabase
    .from("users")
    .update({
      vehicle_info: vehicleInfo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", driverId);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

/**
 * Fetches the driver's profile information.
 * 
 * @param {string} driverId - Driver user ID.
 */
export async function getDriverProfile(driverId: string): Promise<{ user: DriverProfile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role, vehicle_info, created_at")
    .eq("id", driverId)
    .maybeSingle();

  if (error) return { user: null, error: error.message };
  if (!data) return { user: null, error: null };

  return { user: data as unknown as DriverProfile, error: null };
}

/**
 * Streams live GPS coordinates for an assigned active ride.
 * 
 * @param {string} driverId - Driver updating location.
 * @param {string} rideId - The active ride ID.
 * @param {number} latitude - Current latitude coordinate.
 * @param {number} longitude - Current longitude coordinate.
 */
export async function updateDriverLocation(
  driverId: string,
  rideId: string,
  latitude: number,
  longitude: number
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { ok: false as const, error: "Invalid location coordinates." };
  }

  const { data, error } = await supabase
    .from("rides")
    .update({
      driver_lat: latitude,
      driver_lng: longitude,
      driver_location_updated_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .eq("driver_id", driverId)
    .in("status", ["accepted", "in_progress"])
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data) {
    return {
      ok: false as const,
      error: "Ride not found or not currently assigned to this driver",
    };
  }

  return { ok: true as const };
}
