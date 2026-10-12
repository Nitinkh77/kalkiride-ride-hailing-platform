/**
 * @file app/actions/rides.ts
 * @description Next.js Server Actions for Ride Management & Driver Telemetry.
 * 
 * Industry Role: Controller Layer for Ride Domain.
 * Responsibilities:
 * 1. Verify caller session and role permissions before mutating data.
 * 2. Validate input payloads using Zod schemas (`RideRequestSchema`).
 * 3. Coordinate multiple services (OSRM routing, dynamic pricing, Supabase database).
 * 4. Trigger Next.js path cache revalidation (`revalidatePath`).
 */

"use server";

import { revalidatePath } from "next/cache";
import { RideRequestSchema } from "@/schemas";
import { getSession } from "@/services/auth.service";
import { getActivePricing, calculateFare } from "@/services/pricing.service";
import { getRoute } from "@/services/location.service";
import {
  createRide,
  getRideByIdForCustomer,
  getActiveRideForCustomer,
  getAvailableRides as serviceGetAvailableRides,
  acceptRide as serviceAcceptRide,
  startRide as serviceStartRide,
  getActiveRide as serviceGetActiveRide,
  completeRide as serviceCompleteRide,
  getRideHistory as serviceGetRideHistory,
  getDriverStats as serviceGetDriverStats,
  updateVehicleInfo as serviceUpdateVehicleInfo,
  getDriverProfile as serviceGetDriverProfile,
  getDriverDetailsForRide as serviceGetDriverDetailsForRide,
  updateDriverLocation as serviceUpdateDriverLocation,
  cancelRide as serviceCancelRide,
  getCustomerRideHistory as serviceGetCustomerRideHistory,
} from "@/services/ride.service";
import { supabase } from "@/lib/supabase";
import type {
  RideRequestFormState,
  DriverRideRow,
  DriverProfile,
  DriverStats,
  ActionResult,
  VehicleInfoInput,
} from "@/types";

// =============================================================================
// Customer Server Actions
// =============================================================================

/**
 * Server action to request a new ride.
 * 
 * Step-by-Step Flow:
 * 1. Session Check: Verify that the user is logged in.
 * 2. Role Gate: Ensure user is authorized as a 'customer'.
 * 3. Validation: Verify pickup/destination names and coordinates against `RideRequestSchema`.
 * 4. Pricing: Fetch current platform rate per kilometer from the pricing service.
 * 5. Route Calculation: Query OSRM to get authoritative distance and duration.
 * 6. Server-Side Fare: Compute total fare authoritatively on server to prevent tampering.
 * 7. Database Persistence: Insert ride record via `createRide`.
 * 
 * @param {RideRequestFormState} _prevState - Previous action state.
 * @param {FormData} formData - Submitted form containing pickup/dropoff coordinates.
 * @returns {Promise<RideRequestFormState>} Created ride object or validation error messages.
 */
export async function requestRide(
  _prevState: RideRequestFormState,
  formData: FormData
): Promise<RideRequestFormState> {
  // 1. Session verification
  const session = await getSession();
  if (!session) {
    return { message: "Your session has expired. Please log in again." };
  }

  // 2. Role gating
  if (session.role !== "customer") {
    return { message: "Only customers can request rides." };
  }

  // 3. Schema validation
  const parsed = RideRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const {
    pickupLocation,
    pickupLat,
    pickupLng,
    destinationLocation,
    destinationLat,
    destinationLng,
  } = parsed.data;

  // 4. Active pricing lookup
  const pricing = await getActivePricing();
  if (!pricing.ok) {
    console.error("[requestRide] pricing lookup failed:", pricing.error, pricing.details);
    return { message: "Something went wrong. Please try again." };
  }

  // 5. Authoritative route calculation
  const route = await getRoute(
    { lat: pickupLat, lng: pickupLng },
    { lat: destinationLat, lng: destinationLng }
  );

  if (!route.ok) {
    console.error("[requestRide] OSRM route calculation failed:", route.error);
    return {
      message: "Could not calculate the route right now. Please try again.",
    };
  }

  // 6. Server-computed fare
  const fare = calculateFare(
    route.data.distanceKm,
    pricing.data.pricePerKm
  );

  // 7. Insert ride into database
  const created = await createRide({
    customerId: session.userId,
    pickupLocation,
    pickupLat,
    pickupLng,
    destinationLocation,
    destinationLat,
    destinationLng,
    distanceKm: route.data.distanceKm,
    estimatedDurationMinutes: route.data.durationMinutes,
    fare,
    pricePerKmSnapshot: pricing.data.pricePerKm,
    currency: pricing.data.currency,
  });

  if (!created.ok) {
    console.error("[requestRide] insert failed:", created.details);
    return { message: "Something went wrong. Please try again." };
  }

  return { ride: created.data };
}

/**
 * Server action to fetch the customer's current active ride.
 */
export async function getCustomerActiveRide() {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return getActiveRideForCustomer(session.userId);
}

/**
 * Server action to fetch a customer's ride details by ID.
 */
export async function getCustomerRideById(rideId: string) {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return getRideByIdForCustomer(rideId, session.userId);
}

/**
 * Server action to retrieve driver info and live location for an accepted ride.
 */
export async function getDriverDetailsForRide(rideId: string) {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return serviceGetDriverDetailsForRide(rideId, session.userId);
}

/**
 * Server action to cancel an active ride.
 * Can be executed by the customer who requested the trip or the driver assigned.
 *
 * @param {string} rideId - The unique ID of the ride to cancel.
 * @returns {Promise<ActionResult>}
 */
export async function cancelCustomerRide(rideId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }
  return serviceCancelRide(rideId, session.userId);
}

export const cancelRide = cancelCustomerRide;

/**
 * Server action to fetch customer ride history.
 */
export async function getCustomerRideHistoryAction() {
  const session = await getSession();
  if (!session || session.role !== "customer") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return serviceGetCustomerRideHistory(session.userId);
}

/**
 * Server action to fetch current authenticated user profile.
 */
export async function getCurrentUserProfile() {
  const session = await getSession();
  if (!session) {
    return { ok: false as const, error: "Unauthorized" };
  }
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, phone, role, created_at")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !user) {
    return { ok: false as const, error: error?.message || "User not found" };
  }
  return { ok: true as const, data: user };
}

// =============================================================================
// Driver Server Actions
// =============================================================================

/**
 * Fetches available ride requests for drivers.
 */
export async function getAvailableRides(): Promise<{ rides: DriverRideRow[]; error: string | null }> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { rides: [], error: "Unauthorized" };
  }
  return serviceGetAvailableRides();
}

/**
 * Accepts a ride request for the authenticated driver.
 * Revalidates driver dashboard and rides pages.
 */
export async function acceptRide(rideId: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await serviceAcceptRide(rideId, session.userId);
  if (!result.success) return result;

  revalidatePath("/dashboard/driver");
  revalidatePath("/dashboard/driver/rides");
  revalidatePath("/dashboard/driver/active");

  return { success: true, error: null };
}

/**
 * Starts the ride after driver arrives at pickup and customer shares their PIN.
 * Transitions ride status: accepted -> in_progress.
 *
 * @param {string} rideId - The ride to start.
 * @param {string} pin - 4-digit PIN entered by the driver (shown on customer screen).
 */
export async function startRide(rideId: string, pin: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await serviceStartRide(rideId, session.userId, pin);
  if (!result.success) return result;

  revalidatePath("/dashboard/driver/active");

  return { success: true, error: null };
}

/**
 * Retrieves the currently active ride assigned to the driver.
 */
export async function getActiveRide(): Promise<{ ride: DriverRideRow | null; error: string | null }> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { ride: null, error: "Unauthorized" };
  }
  return serviceGetActiveRide(session.userId);
}

/**
 * Marks a ride as completed by the driver.
 */
export async function completeRide(rideId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await serviceCompleteRide(rideId, session.userId);
  if (result.success) {
    revalidatePath("/dashboard/driver");
    revalidatePath("/dashboard/driver/active");
    revalidatePath("/dashboard/driver/history");
  }
  return result;
}

/**
 * Retrieves the driver's completed ride history.
 */
export async function getRideHistory(): Promise<{ rides: DriverRideRow[]; error: string | null }> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { rides: [], error: "Unauthorized" };
  }
  return serviceGetRideHistory(session.userId);
}

/**
 * Calculates analytics and stats for the driver dashboard overview.
 */
export async function getDriverStats(): Promise<{ stats: DriverStats | null; error: string | null }> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { stats: null, error: "Unauthorized" };
  }
  return serviceGetDriverStats(session.userId);
}

/**
 * Updates vehicle specifications in the driver's profile.
 */
export async function updateVehicleInfo(
  vehicleInfo: VehicleInfoInput
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { success: false, error: "Unauthorized" };
  }

  const result = await serviceUpdateVehicleInfo(session.userId, vehicleInfo);
  if (result.success) {
    revalidatePath("/dashboard/driver/vehicle");
  }
  return result;
}

/**
 * Retrieves the driver's account profile.
 */
export async function getDriverProfile(): Promise<{ user: DriverProfile | null; error: string | null }> {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { user: null, error: "Unauthorized" };
  }
  return serviceGetDriverProfile(session.userId);
}

/**
 * Updates the driver's live GPS coordinates during an active trip.
 */
export async function updateDriverLocation(
  rideId: string,
  latitude: number,
  longitude: number
) {
  const session = await getSession();
  if (!session || session.role !== "driver") {
    return { ok: false as const, error: "Unauthorized" };
  }
  return serviceUpdateDriverLocation(session.userId, rideId, latitude, longitude);
}