/**
 * @file app/dashboard/driver/vehicle/page.tsx
 * @description Driver Vehicle Details & Settings Page (/dashboard/driver/vehicle).
 * 
 * Flow:
 * 1. Queries the authenticated driver's profile via `getDriverProfile()`.
 * 2. Passes vehicle specs (make, model, year, plate, color) to `VehicleForm`.
 */

import { getDriverProfile } from "@/services/ride.service";
import { getSession } from "@/services/auth.service";
import { VehicleForm } from "@/components/driver/vehicle-form";
import type { VehicleInfo } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Driver Vehicle Page Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function VehiclePage() {
  const session = await getSession();
  const { user, error } = await getDriverProfile(session?.userId || "");
  const vehicleInfo = (user?.vehicle_info as VehicleInfo) || null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Fleet details</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Vehicle Information
        </h1>
        <p className="mt-2 text-slate-600">
          Keep your vehicle specifications and license plate updated for customer confidence.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <VehicleForm initialData={vehicleInfo} />
      </div>
    </div>
  );
}