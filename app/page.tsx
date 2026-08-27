import { getProducts } from "@/lib/products";
import { calculateReadiness, evaluateRisk } from "@/lib/evaluate-risk";
import { getCategoryOptions, resolveCategory, ALL_CATEGORIES } from "@/lib/category";
import { HeroSection } from "@/components/hero-section";
import { StatsStrip } from "@/components/stats-strip";
import { FeaturedSpotlight } from "@/components/featured-spotlight";
import { LineupGrid } from "@/components/lineup-grid";
import { ClosingSection } from "@/components/closing-section";

// Server Component: data is fetched and rendered on the server, no "use client".
// searchParams is only readable here (Next only passes it to page.tsx), so the category
// filter is resolved and applied here too, then handed down already-filtered.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const products = await getProducts();
  const { category: rawCategory } = await searchParams;

  const categories = getCategoryOptions(products);
  const selectedCategory = resolveCategory(categories, rawCategory);
  const lineupProducts =
    selectedCategory === ALL_CATEGORIES
      ? products
      : products.filter((p) => p.category === selectedCategory);

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

  // Soonest upcoming launch, for the spotlight section.
  const featured = [...products].sort((a, b) => a.launchDate.localeCompare(b.launchDate))[0];

  const averageReadiness = Math.round(
    products.reduce((sum, p) => sum + calculateReadiness(p.checkpoints), 0) / products.length
  );

  return (
    <main>
      <HeroSection
        eyebrow="Launch Overview"
        title="Every launch, ready before it ships."
        subtitle="Track inventory, pricing, content, and compliance across every product headed to market this season."
        image="/images/products/classic-cotton-collection.jpg"
      />
      <StatsStrip stats={stats} />
      <FeaturedSpotlight product={featured} />
      <LineupGrid
        products={lineupProducts}
        categories={categories}
        selectedCategory={selectedCategory}
      />
      <ClosingSection averageReadiness={averageReadiness} />
    </main>
  );
}
