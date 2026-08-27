type Stats = { total: number; ready: number; atRisk: number; blocked: number };

// Editorial stat row (large numerals, thin dividers) rather than boxed dashboard cards.
export function StatsStrip({ stats }: { stats: Stats }) {
  const items: { label: string; value: number; accent?: string }[] = [
    { label: "Launches this season", value: stats.total },
    { label: "Ready", value: stats.ready, accent: "text-risk-low-ink" },
    { label: "At risk", value: stats.atRisk, accent: "text-risk-medium-ink" },
    { label: "Blocked", value: stats.blocked, accent: "text-risk-high-ink" },
  ];

  return (
    <section className="px-6 py-16 sm:px-10 lg:px-14">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">At a glance</p>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 sm:gap-x-10">
        {items.map((item, i) => (
          <div key={item.label} className={i > 0 ? "sm:border-l sm:border-border sm:pl-10" : ""}>
            <div
              className={`font-[family-name:var(--font-display)] text-5xl font-semibold ${
                item.accent ?? "text-ink"
              }`}
            >
              {item.value}
            </div>
            <div className="mt-2 text-sm text-ink-soft">{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
