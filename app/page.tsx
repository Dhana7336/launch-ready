import { getProducts } from "@/lib/products";
import { evaluateRisk } from "@/lib/evaluate-risk";
import { DashboardStats } from "@/components/dashboard-stats";
import { ProductTable } from "@/components/product-table";
import { ProductCard } from "@/components/product-card";

// Server Component: data is fetched and rendered on the server, no "use client".
export default async function HomePage() {
  const products = await getProducts();

  const stats = products.reduce(
    (acc, product) => {
      const risk = evaluateRisk(product.checkpoints);
      if (risk === "LOW") acc.ready += 1;
      else if (risk === "MEDIUM") acc.atRisk += 1;
      else acc.blocked += 1;
      return acc;
    },
    { total: products.length, ready: 0, atRisk: 0, blocked: 0 }
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">LaunchReady</h1>
        <p className="mt-1 text-gray-600">
          Monitor upcoming launches, readiness, and operational risk.
        </p>
      </header>

      <div className="mb-8">
        <DashboardStats stats={stats} />
      </div>

      <div className="hidden md:block">
        <ProductTable products={products} />
      </div>
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
