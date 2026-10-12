/**
 * @file app/api/driver/rides/route.ts
 * @description REST API Route: GET /api/driver/rides
 * 
 * Returns available nearby ride requests for drivers.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { getAvailableRides } from "@/services/ride.service";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getAvailableRides();
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rides: result.rides });
}
