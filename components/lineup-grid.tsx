import type { Product } from "@/types/product";
import { ProductCard } from "./product-card";
import { CategorySelect } from "./category-select";

export function LineupGrid({
  products,
  categories,
  selectedCategory,
}: {
  products: Product[];
  categories: string[];
  selectedCategory: string;
}) {
  return (
    <section className="px-6 py-16 sm:px-10 lg:px-14">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
            The full lineup
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
            Every launch in motion
          </h2>
        </div>

        <CategorySelect categories={categories} selected={selectedCategory} />
      </div>

      {products.length === 0 ? (
        <p className="text-ink-soft">No launches in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
