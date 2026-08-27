import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "LaunchReady",
    template: "%s | LaunchReady",
  },
  description:
    "Track product launch readiness — inventory, pricing, content, and compliance — with automatically computed risk across every product headed to market.",
};

// Typed manually rather than with Next's generated `LayoutProps<"/">` helper — that type
// only exists in `.next/types` after a `next build`/`next dev` has run at least once, so
// `npm run typecheck` on a clean checkout (no prior build — this is exactly what CI does)
// would fail with "Cannot find name 'LayoutProps'" before ever generating it.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">
        <div className="flex min-h-full flex-col md:flex-row">
          <Sidebar />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
