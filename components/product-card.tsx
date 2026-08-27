import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { calculateReadiness } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { categoryTint } from "@/lib/category";

// Category/title/date live directly on the image via a gradient scrim, matching the
// homepage hero's treatment, instead of a separate white caption area below the photo.
export function ProductCard({ product }: { product: Product }) {
  const readiness = calculateReadiness(product.checkpoints);

  return (
    <Link
      href={`/products/${product.id}`}
      data-testid="product-card"
      data-product-id={product.id}
      className="group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 100vw"
        className="object-cover transition duration-300 group-hover:scale-105 group-focus-visible:scale-105"
      />

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/50 to-transparent p-5">
        {/* Category + readiness stay hover/focus-only, revealed just above the
            always-visible title block — keyboard users get the same reveal via
            group-focus-visible. Risk is intentionally not shown here at all; full risk
            detail lives on the product page. */}
        <div
          data-testid="readiness-overlay"
          className="mb-3 flex translate-y-2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        >
          <span
            className={`inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-medium text-ink-soft ${categoryTint(product.category)}`}
          >
            {product.category}
          </span>
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-sidebar-ink/75">
              Readiness
            </div>
            <div className="font-[family-name:var(--font-display)] text-3xl font-semibold text-sidebar-ink">
              {readiness}%
            </div>
          </div>
        </div>

        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-sidebar-ink">
          {product.name}
        </h3>
        <p className="text-xs text-sidebar-ink/70">Launch {formatLaunchDate(product.launchDate)}</p>
      </div>
    </Link>
  );
}
