import Link from "next/link";
import type { Product } from "@/types/product";
import { calculateReadiness, evaluateRisk } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { RiskBadge } from "./risk-badge";
import { ReadinessProgress } from "./readiness-progress";

// Mobile-friendly alternative to ProductTable, shown below the md breakpoint.
export function ProductCard({ product }: { product: Product }) {
  const readiness = calculateReadiness(product.checkpoints);
  const risk = evaluateRisk(product.checkpoints);

  return (
    <Link
      href={`/products/${product.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-gray-900">{product.name}</div>
          <div className="text-xs text-gray-500">Launch {formatLaunchDate(product.launchDate)}</div>
        </div>
        <RiskBadge risk={risk} />
      </div>
      <div className="mt-3">
        <ReadinessProgress value={readiness} />
      </div>
    </Link>
  );
}
