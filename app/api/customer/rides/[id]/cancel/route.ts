/**
 * @file app/api/customer/rides/[id]/cancel/route.ts
 * @description REST API Route: POST /api/customer/rides/:id/cancel
 * 
 * Cancels an active customer ride request.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { cancelRide } from "@/services/ride.service";

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
