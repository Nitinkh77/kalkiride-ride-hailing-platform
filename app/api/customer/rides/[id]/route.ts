/**
 * @file app/api/customer/rides/[id]/route.ts
 * @description REST API Route: GET /api/customer/rides/:id
 * 
 * Fetches ride details and assigned driver information for a customer.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import {
  getRideByIdForCustomer,
  getDriverDetailsForRide,
  cancelRide,
} from "@/services/ride.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "customer") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await params;

  const [rideResult, driverResult] = await Promise.all([
    getRideByIdForCustomer(rideId, session.userId),
    getDriverDetailsForRide(rideId, session.userId),
  ]);

  if (!rideResult.ok) {
    return NextResponse.json(
      { ok: false, error: "Ride not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    ride: rideResult.data,
    driver: driverResult.ok ? driverResult.data : null,
  });
}

/**
 * POST /api/customer/rides/:id/cancel or POST /api/customer/rides/:id
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await params;
  const result = await cancelRide(rideId, session.userId);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to cancel ride" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Ride cancelled successfully",
  });
}

/**
 * DELETE /api/customer/rides/:id
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await params;
  const result = await cancelRide(rideId, session.userId);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: result.error || "Failed to cancel ride" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Ride cancelled successfully",
  });
}
