/**
 * @file app/api/driver/rides/[id]/location/route.ts
 * @description REST API Route: POST /api/driver/rides/:id/location
 * 
 * Ingests live telemetry GPS coordinates from driver's device for real-time tracking.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { updateDriverLocation } from "@/services/ride.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: rideId } = await params;
    const body = await request.json();
    const { latitude, longitude } = body;

    const result = await updateDriverLocation(
      session.userId,
      rideId,
      Number(latitude),
      Number(longitude)
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Location updated" });
  } catch (err) {
    console.error("[POST /api/driver/rides/:id/location] Error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
