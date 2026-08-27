export function ClosingSection({ averageReadiness }: { averageReadiness: number }) {
  return (
    <section className="bg-sage-soft px-6 py-20 text-center sm:px-10 lg:px-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft">LaunchReady</p>
      <h2 className="mx-auto mt-4 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold text-ink sm:text-4xl">
        Every requirement, tracked before a product ever goes live.
      </h2>
      <p className="mt-4 font-[family-name:var(--font-display)] text-2xl text-ink-soft">
        {averageReadiness}% average readiness across active launches
      </p>
    </section>
  );
}
