import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import { calculateReadiness, evaluateRisk, remainingTasks } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { RiskBadge } from "@/components/risk-badge";
import { ReadinessProgress } from "@/components/readiness-progress";
import { CheckpointList } from "@/components/checkpoint-list";

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
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
        ← Back to Products
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{product.name}</h1>
        <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-gray-400">Launch Date</dt>
            <dd className="font-medium text-gray-900">
              {formatLaunchDate(product.launchDate, { month: "long", day: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400">Owner</dt>
            <dd className="font-medium text-gray-900">{product.owner}</dd>
          </div>
          <div>
            <dt className="text-gray-400">Category</dt>
            <dd className="font-medium text-gray-900">{product.category}</dd>
          </div>
        </dl>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <ReadinessProgress value={readiness} />
        </div>
        <div className="flex flex-col justify-center rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-1.5 text-sm font-medium text-gray-700">Risk</div>
          <RiskBadge risk={risk} />
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Launch Readiness</h2>
        <CheckpointList productId={product.id} checkpoints={product.checkpoints} />
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-gray-900">Risk Evaluation</h2>
        <RiskBadge risk={risk} />
        <p className="mt-2 text-sm text-gray-600">
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
    </main>
  );
}
