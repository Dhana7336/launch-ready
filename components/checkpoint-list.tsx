import type { Checkpoint } from "@/types/product";
import { CheckpointToggleForm } from "./checkpoint-toggle-form";

// Server Component: only the form (checkpoint-toggle-form.tsx) is a client component, and
// only because useActionState needs to own the <form> element to read back the action's
// returned state (see app/actions.ts). Everything else here stays server-rendered.
export function CheckpointList({
  productId,
  checkpoints,
}: {
  productId: string;
  checkpoints: Checkpoint[];
}) {
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
      {checkpoints.map((checkpoint) => (
        <li key={checkpoint.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                checkpoint.completed
                  ? "bg-risk-low-bg text-risk-low-ink"
                  : "bg-risk-high-bg text-risk-high-ink"
              }`}
            >
              {checkpoint.completed ? "✓" : "✕"}
            </span>
            <div>
              <div className="text-sm font-medium text-ink">{checkpoint.label}</div>
              <div className="text-xs text-muted">
                {checkpoint.weight}% weight
                {checkpoint.critical ? " · critical" : ""}
              </div>
            </div>
          </div>
          <CheckpointToggleForm productId={productId} checkpoint={checkpoint} />
        </li>
      ))}
    </ul>
  );
}
