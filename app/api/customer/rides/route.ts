/**
 * @file app/api/customer/rides/route.ts
 * @description REST API Route: /api/customer/rides
 * 
 * - GET: Retrieves active ride for current authenticated customer.
 * - POST: Creates a new ride booking request.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { RideRequestSchema } from "@/schemas";
import { getActivePricing, calculateFare } from "@/services/pricing.service";
import { getRoute } from "@/services/location.service";
import { createRide, getActiveRideForCustomer } from "@/services/ride.service";

/**
 * GET: Returns active ride for current authenticated customer.
 */
export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getActiveRideForCustomer(session.userId);
  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: true, ride: null });
    }
    return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ride: result.data });
}

/**
 * POST: Requests a new ride.
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = RideRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      pickupLocation,
      pickupLat,
      pickupLng,
      destinationLocation,
      destinationLat,
      destinationLng,
    } = parsed.data;

    const pricing = await getActivePricing();
    if (!pricing.ok) {
      return NextResponse.json({ ok: false, error: "Pricing service unavailable" }, { status: 500 });
    }

    const route = await getRoute(
      { lat: pickupLat, lng: pickupLng },
      { lat: destinationLat, lng: destinationLng }
    );

    if (!route.ok) {
      return NextResponse.json({ ok: false, error: route.error.message }, { status: 400 });
    }

    const fare = calculateFare(route.data.distanceKm, pricing.data.pricePerKm);

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
      return NextResponse.json({ ok: false, error: "Could not create ride" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, ride: created.data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/customer/rides] Error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
