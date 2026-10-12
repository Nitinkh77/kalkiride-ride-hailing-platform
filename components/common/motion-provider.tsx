/**
 * @file components/common/motion-provider.tsx
 * @description Global Motion config. reducedMotion="user" makes every Motion animation
 * honour the OS "reduce motion" setting (transforms are disabled, opacity still fades).
 */

"use client";

import React from "react";
import { MotionConfig } from "motion/react";

export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
