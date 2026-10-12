/**
 * @file app/api/driver/rides/[id]/complete/route.ts
 * @description REST API Route: POST /api/driver/rides/:id/complete
 * 
 * Finalizes an ongoing trip and marks it completed.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { completeRide } from "@/services/ride.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: rideId } = await params;
  const result = await completeRide(rideId, session.userId);

  if (!result.success) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Ride marked completed" });
}
