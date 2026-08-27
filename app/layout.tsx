import type { Metadata } from "next";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
