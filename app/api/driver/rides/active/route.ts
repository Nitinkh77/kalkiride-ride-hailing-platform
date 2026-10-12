/**
 * @file app/api/driver/rides/active/route.ts
 * @description REST API Route: GET /api/driver/rides/active
 * 
 * Returns the active trip currently assigned to the driver.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { getActiveRide } from "@/services/ride.service";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getActiveRide(session.userId);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ride: result.ride });
}
