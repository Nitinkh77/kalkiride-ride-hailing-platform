/**
 * @file components/common/toast-provider.tsx
 * @description Global Toast Notification Provider.
 * 
 * Configures the `react-hot-toast` Toaster container with custom styling,
 * duration, and animation styles for success, error, and info popups.
 */

"use client";

import { Toaster } from "react-hot-toast";

/**
 * Toast Notification Provider mounted inside root `layout.tsx`.
 * Provides user feedback alerts for errors, successful logins, and ride updates.
 * 
 * @returns {JSX.Element}
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          border: "1px solid #dbe4f0",
          borderRadius: "12px",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.18)",
          color: "#334155",
          fontSize: "13px",
          fontWeight: 600,
          maxWidth: "min(92vw, 380px)",
          padding: "12px 16px",
        },
        success: {
          iconTheme: {
            primary: "#2563eb",
            secondary: "#ffffff",
          },
          style: {
            borderColor: "#bfdbfe",
          },
        },
        error: {
          iconTheme: {
            primary: "#dc2626",
            secondary: "#ffffff",
          },
          style: {
            borderColor: "#fecaca",
          },
        },
      }}
    />
  );
}
