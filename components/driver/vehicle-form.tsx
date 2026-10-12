/**
 * @file components/driver/vehicle-form.tsx
 * @description Driver Vehicle Details Form Component.
 * 
 * Allows drivers to view and update their vehicle specifications
 * (make, model, manufacturing year, color, and plate registration number).
 */

"use client";

import { useState } from "react";
import { updateVehicleInfo } from "@/app/actions/rides";
import type { VehicleInfo } from "@/types";

interface VehicleFormProps {
  initialData: VehicleInfo | null;
}

/**
 * Driver Vehicle Settings Form.
 * 
 * @param {VehicleFormProps} props - Component properties.
 * @returns {JSX.Element}
 */
export function VehicleForm({ initialData }: VehicleFormProps) {
  const [form, setForm] = useState<VehicleInfo>(
    initialData || {
      make: "",
      model: "",
      year: undefined,
      plateNumber: "",
      color: "",
    }
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Submits updated vehicle details via `updateVehicleInfo` server action.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const res = await updateVehicleInfo({
      make: form.make || "",
      model: form.model || "",
      year: Number(form.year) || 0,
      plateNumber: form.plateNumber || "",
      color: form.color || "",
    });

    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error || "Failed to update vehicle details");
    }
    setLoading(false);
  };

  const update = (key: keyof VehicleInfo, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Vehicle Category
        </label>
        <div className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-xs font-semibold text-orange-700">
          <span>🛺</span> Auto Rickshaw
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Make / Manufacturer
          </label>
          <input
            type="text"
            value={form.make || ""}
            onChange={(e) => update("make", e.target.value)}
            placeholder="e.g. Bajaj, Piaggio"
            className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Model
          </label>
          <input
            type="text"
            value={form.model || ""}
            onChange={(e) => update("model", e.target.value)}
            placeholder="e.g. Compact RE, Ape"
            className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Year of Manufacture
          </label>
          <input
            type="number"
            value={form.year || ""}
            onChange={(e) => update("year", Number(e.target.value))}
            placeholder="2023"
            className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Vehicle Color
          </label>
          <input
            type="text"
            value={form.color || ""}
            onChange={(e) => update("color", e.target.value)}
            placeholder="e.g. Yellow & Green, Black"
            className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Registration / Plate Number
        </label>
        <input
          type="text"
          value={form.plateNumber || ""}
          onChange={(e) => update("plateNumber", e.target.value.toUpperCase())}
          placeholder="e.g. DL 01 AB 1234"
          className="w-full h-10 rounded border border-slate-200 px-3 text-sm text-slate-700 uppercase outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          Vehicle details updated successfully.
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Vehicle Details"}
        </button>
      </div>
    </form>
  );
}
