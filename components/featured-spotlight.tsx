import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { calculateReadiness, evaluateRisk } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { categoryTint } from "@/lib/category";
import { RiskBadge } from "./risk-badge";

// Asymmetrical text-and-image editorial layout, highlighting the soonest launch.
export function FeaturedSpotlight({ product }: { product: Product }) {
  const readiness = calculateReadiness(product.checkpoints);
  const risk = evaluateRisk(product.checkpoints);

  return (
    <section className="px-6 py-16 sm:px-10 lg:px-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sand lg:aspect-[5/4]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            Next to launch
          </p>
          <span
            className={`mt-3 inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-medium text-ink-soft ${categoryTint(
              product.category
            )}`}
          >
            {product.category}
          </span>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink sm:text-4xl">
            {product.name}
          </h2>
          <p className="mt-3 max-w-md text-ink-soft">
            Launching{" "}
            {formatLaunchDate(product.launchDate, { month: "long", day: "numeric" })} —
            currently {readiness}% ready.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <RiskBadge risk={risk} />
            <span className="text-sm text-muted">
              {product.owner} &middot; {product.category}
            </span>
          </div>

          <Link
            href={`/products/${product.id}`}
            className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
          >
            Explore this launch <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
