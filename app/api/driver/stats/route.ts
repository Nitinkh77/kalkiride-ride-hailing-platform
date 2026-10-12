/**
 * @file app/api/driver/stats/route.ts
 * @description REST API Route: GET /api/driver/stats
 * 
 * Returns calculated analytics for the authenticated driver's dashboard.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/services/auth.service";
import { getDriverStats } from "@/services/ride.service";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "driver") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getDriverStats(session.userId);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stats: result.stats });
}
