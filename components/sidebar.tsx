"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Overview", href: "/", active: true },
  { label: "Products", soon: true },
  { label: "Vendors", soon: true },
  { label: "Reports", soon: true },
] as const;

// Client Component: below md, the nav becomes an off-canvas drawer behind a hamburger
// button, like a commercial e-commerce mobile header, instead of pushing full-height
// content above the page. At md+ it's the same always-visible sticky column as before —
// this component owns both responsive states so the open/close state never has to cross
// a component boundary.
export function Sidebar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLinks = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) =>
        "href" in item ? (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              item.active
                ? "bg-sidebar-active text-sidebar-ink"
                : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-sidebar-ink"
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-sidebar-muted/60"
          >
            <span>{item.label}</span>
            <span className="text-[10px] uppercase tracking-wide">Soon</span>
          </div>
        )
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile/tablet top bar — replaces the full-height stacked sidebar below md. */}
      <div className="flex items-center justify-between bg-sidebar px-6 py-4 md:hidden">
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-sidebar-ink">
          LaunchReady
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={open}
          className="rounded-md p-2 text-sidebar-ink transition hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M2.5 5.5h15M2.5 10h15M2.5 14.5h15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Backdrop — dismisses the drawer on tap; the drawer's own close button and Escape
          handle keyboard dismissal, so this stays out of the tab order. */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col justify-between bg-sidebar px-6 py-8 transition-transform duration-300 md:static md:z-auto md:h-screen md:w-64 md:translate-x-0 md:px-6 md:py-8 md:sticky md:top-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="mb-10 flex items-start justify-between">
            <div>
              <div className="font-[family-name:var(--font-display)] text-xl font-semibold text-sidebar-ink">
                LaunchReady
              </div>
              <p className="mt-1 text-xs text-sidebar-muted">Launch Readiness</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
              className="rounded-md p-1 text-sidebar-ink transition hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar md:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {navLinks}
        </div>

        <div className="mt-8 text-xs text-sidebar-muted md:mt-0">BHF &middot; Product Ops</div>
      </aside>
    </>
  );
}
