/**
 * @file app/layout.tsx
 * @description Root Application Layout.
 * 
 * Injects Geist Sans/Geist Mono fonts, the pre-paint theme script, global CSS styles, metadata, and the global ToastProvider.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/common/toast-provider";
import MotionProvider from "@/components/common/motion-provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KalkiRide | Fast, Transparent & Reliable City Rides",
  description: "Book autos, bikes, and cabs with upfront pricing and live driver tracking.",
};

/**
 * Root HTML shell for the Next.js application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
