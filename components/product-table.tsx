import Link from "next/link";
import type { Product } from "@/types/product";
import { calculateReadiness, evaluateRisk } from "@/lib/evaluate-risk";
import { formatLaunchDate } from "@/lib/format-date";
import { RiskBadge } from "./risk-badge";

// Desktop table view, shown at the md breakpoint and above.
export function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Launch</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Ready</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Risk</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            const readiness = calculateReadiness(product.checkpoints);
            const risk = evaluateRisk(product.checkpoints);
            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-600">{formatLaunchDate(product.launchDate)}</td>
                <td className="px-4 py-3 text-gray-600">{readiness}%</td>
                <td className="px-4 py-3">
                  <RiskBadge risk={risk} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    View Details →
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
