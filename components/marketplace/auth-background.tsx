/**
 * @file components/marketplace/auth-background.tsx
 * @description Blurred Backdrop Background for standalone Login & Signup pages.
 */

"use client";

import HeroSection from "./hero-section";

export default function AuthBackground() {
  function ignoreContinue() {}
  function ignoreLocation() {}

  return (
    <div className="pointer-events-none min-h-screen blur-[1px]">
      <HeroSection
        isAuthenticated={false}
        onContinue={ignoreContinue}
        onPickupChange={ignoreLocation}
        onDestinationChange={ignoreLocation}
      />
    </div>
  );
}
