/**
 * @file app/dashboard/driver/profile/page.tsx
 * @description Driver Profile Settings Page (/dashboard/driver/profile).
 * 
 * Flow:
 * 1. Queries driver profile via `getDriverProfile()`.
 * 2. Renders verified badge and `ProfileForm` for updating driver name.
 */

import { getDriverProfile } from "@/services/ride.service";
import { getSession } from "@/services/auth.service";
import { ProfileForm } from "@/components/driver/profile-form";

export const dynamic = "force-dynamic";

/**
 * Driver Profile Page Server Component.
 * 
 * @returns {Promise<JSX.Element>}
 */
export default async function DriverProfilePage() {
  const session = await getSession();
  const { user, error } = await getDriverProfile(session?.userId || "");

  if (error || !user) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Failed to load driver profile"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <p className="text-sm font-medium text-slate-500">Account settings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-800">
          Driver Profile
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your personal information and verified driver status.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-700">
            🛺
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {user.name || "Driver"}
            </h2>
            <p className="text-xs text-slate-500">{user.email}</p>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Verified Driver
            </span>
          </div>
        </div>

        <ProfileForm
          initialName={user.name || ""}
          phone={user.phone || ""}
          email={user.email || ""}
          memberSince={user.created_at}
        />
      </div>
    </div>
  );
}