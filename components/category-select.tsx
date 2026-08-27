"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_CATEGORIES } from "@/lib/category";

const CATEGORY_PARAM = "category";

// The smallest possible Client Component: it holds no product data and does no filtering —
// that all happens server-side in app/page.tsx from the URL. This only translates a select
// change into a URL change (preserving any other query params) via router.push, so the
// resulting navigation participates in browser back/forward history.
export function CategorySelect({
  categories,
  selected,
}: {
  categories: string[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_CATEGORIES) {
      params.delete(CATEGORY_PARAM);
    } else {
      params.set(CATEGORY_PARAM, value);
    }
    const query = params.toString();
    // scroll: false — this is a same-page filter change, not a real navigation; without
    // it, Next's default scroll-to-top-on-navigate behavior yanks the visitor away from
    // the lineup grid they were just looking at.
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <label className="inline-flex items-center self-start sm:self-auto">
      <span className="sr-only">Filter by category</span>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="appearance-none rounded-full border border-border bg-surface py-2 px-4 text-sm font-medium text-ink shadow-sm transition hover:border-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <option value={ALL_CATEGORIES}>All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
