import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProduct, getStaticProduct } from "@/lib/products";
import { calculateReadiness, evaluateRisk, remainingTasks } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { categoryTint } from "@/lib/category";
import { RiskBadge } from "@/components/risk-badge";
import { ProductSpecGrid } from "@/components/product-spec-grid";
import { CheckpointList } from "@/components/checkpoint-list";

// Uses getStaticProduct (cookie-independent), not getProduct — the title/description
// shouldn't shift based on which checkpoints this particular visitor has toggled. Doesn't
// call notFound() itself for an unknown id; that stays the page component's job below.
// The title is just the product name — app/layout.tsx's "%s | LaunchReady" template
// appends the suffix, so it isn't duplicated here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getStaticProduct(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  return {
    title: product.name,
    description: `${product.name} (${product.category}) — launch readiness, checklist, and risk status.`,
  };
}

// Dynamic route: /products/[id]. Server Component, rendered per request.
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const readiness = calculateReadiness(product.checkpoints);
  const risk = evaluateRisk(product.checkpoints);
  const remaining = remainingTasks(product.checkpoints);
  const criticalRemaining = remaining.filter((c) => c.critical);

  return (
    <main>
      <div className="relative h-[34vh] min-h-[240px] max-h-[420px] w-full overflow-hidden bg-sand sm:h-[42vh]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 768px) calc(100vw - 256px), 100vw"
          className="object-cover object-center sm:object-[50%_35%]"
          priority
        />
        {/* Category/title on the image, matching the homepage hero and product cards —
            not a separate white header block. */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/85 via-ink/25 to-transparent">
          <div className="px-6 pb-6 sm:px-10 sm:pb-8 lg:px-14">
            <span
              className={`inline-block w-fit rounded-full px-2 py-0.5 text-[11px] font-medium text-ink-soft ${categoryTint(product.category)}`}
            >
              {product.category}
            </span>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-sidebar-ink sm:text-4xl">
              {product.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-10 sm:px-10 lg:px-14">
        <ProductSpecGrid
          launchDate={formatLaunchDate(product.launchDate, { month: "long", day: "numeric" })}
          owner={product.owner}
          readiness={readiness}
          risk={risk}
        />

        <section className="mb-8 mt-8">
          <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
            Launch Readiness
          </h2>
          <CheckpointList productId={product.id} checkpoints={product.checkpoints} />
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-ink">Risk Evaluation</h2>
          <RiskBadge risk={risk} />
          <p className="mt-2 text-sm text-ink-soft">
            {remaining.length === 0
              ? "All launch requirements complete."
              : `${remaining.length} launch requirement${
                  remaining.length === 1 ? "" : "s"
                } remain incomplete.`}{" "}
            {criticalRemaining.length > 0
              ? `${criticalRemaining.length} critical blocker${
                  criticalRemaining.length === 1 ? "" : "s"
                } detected.`
              : "No critical blockers detected."}
          </p>
        </section>
      </div>
    </main>
  );
}
