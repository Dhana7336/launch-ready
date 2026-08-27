import type { Metadata } from "next";

// When the page component calls notFound(), Next renders this segment instead — and
// resolves ITS metadata, not whatever generateMetadata() in page.tsx returned for the
// failed render. So the "Product Not Found" title needs its own export here too, or the
// live 404 response falls through to the root layout's default title ("LaunchReady")
// instead of the sensible fallback. Confirmed by curling the actual route, not just by
// the generateMetadata() unit test (which only proves the function's own return value,
// not what Next does with it once notFound() fires).
export const metadata: Metadata = {
  title: "Product Not Found",
};

export default function ProductNotFound() {
  return (
    <main className="px-6 py-20 text-center sm:px-10 lg:px-14">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
        Product not found
      </h1>
      <p className="mt-2 text-ink-soft">We couldn&apos;t find a product with that ID.</p>
    </main>
  );
}
