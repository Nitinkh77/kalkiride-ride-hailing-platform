/**
 * @file app/ride-book/page.tsx
 * @description Ride Booking Route Delegator.
 * 
 * Automatically redirects visitors to `/ride-details`.
 */

import { redirect } from "next/navigation";

export default function RideBookPage() {
  redirect("/ride-details");
}
