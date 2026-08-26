type Stats = { total: number; ready: number; atRisk: number; blocked: number };

export function DashboardStats({ stats }: { stats: Stats }) {
  const items: { label: string; value: number; accent?: string }[] = [
    { label: "Products", value: stats.total },
    { label: "Ready", value: stats.ready, accent: "text-emerald-600" },
    { label: "At Risk", value: stats.atRisk, accent: "text-amber-600" },
    { label: "Blocked", value: stats.blocked, accent: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className={`text-2xl font-semibold ${item.accent ?? "text-gray-900"}`}>
            {item.value}
          </div>
          <div className="text-sm text-gray-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
