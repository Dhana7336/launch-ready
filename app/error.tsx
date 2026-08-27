"use client";

import { useEffect } from "react";
import Link from "next/link";

// Next.js requires error.tsx to be a Client Component (it needs the reset() callback and
// lifecycle access). This is the minimal fallback for an uncaught error anywhere in the
// app — styled to match the rest of the app instead of Next's generic default error page.
// toggleCheckpoint (app/actions.ts) no longer throws for invalid input — that's an
// "expected" failure now returned as typed state and shown inline (see
// components/checkpoint-toggle-form.tsx). What lands here is genuinely unexpected: a
// cookie-store or cache-invalidation failure, not something a user caused.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        That action couldn&apos;t be completed. Try again, or head back to the dashboard.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-sidebar-ink transition hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link href="/" className="text-sm font-medium text-primary hover:text-primary-hover">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
