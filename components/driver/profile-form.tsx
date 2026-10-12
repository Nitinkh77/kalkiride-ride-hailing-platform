/**
 * @file components/driver/profile-form.tsx
 * @description Driver Profile Form Component.
 * 
 * Displays the driver's registered account details:
 * - Editable Full Name.
 * - Read-only verified Phone Number & Email.
 * - Account membership start date.
 */

"use client";

import { useState } from "react";

interface ProfileFormProps {
  initialName: string;
  phone: string;
  email: string;
  memberSince: string;
}

/**
 * Driver Profile Information Form.
 * 
 * @param {ProfileFormProps} props - Component properties.
 * @returns {JSX.Element}
 */
export function ProfileForm({
  initialName,
  phone,
  email,
  memberSince,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          disabled
          className="w-full h-10 rounded border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed outline-none"
        />
        <p className="text-[11px] text-slate-400 mt-1">Verified phone number cannot be changed directly.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full h-10 rounded border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 cursor-not-allowed outline-none"
        />
        <p className="text-[11px] text-slate-400 mt-1">Primary email associated with your driver account.</p>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Member since{" "}
          <strong className="text-slate-700">
            {new Date(memberSince).toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </p>
      </div>
    </div>
  );
}
