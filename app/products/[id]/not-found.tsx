import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Product not found</h1>
      <p className="mt-2 text-gray-600">We couldn&apos;t find a product with that ID.</p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline"
      >
        ← Back to Products
      </Link>
    </main>
  );
}
