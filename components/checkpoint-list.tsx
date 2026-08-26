import type { Checkpoint } from "@/types/product";
import { toggleCheckpoint } from "@/app/actions";

// Server Component: each row's button submits a form bound to the server action,
// so no client-side JavaScript is required for the interaction to work.
export function CheckpointList({
  productId,
  checkpoints,
}: {
  productId: string;
  checkpoints: Checkpoint[];
}) {
  return (
    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {checkpoints.map((checkpoint) => (
        <li key={checkpoint.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                checkpoint.completed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {checkpoint.completed ? "✓" : "✕"}
            </span>
            <div>
              <div className="text-sm font-medium text-gray-900">{checkpoint.label}</div>
              <div className="text-xs text-gray-500">
                {checkpoint.weight}% weight
                {checkpoint.critical ? " · critical" : ""}
              </div>
            </div>
          </div>
          <form action={toggleCheckpoint.bind(null, productId, checkpoint.id)}>
            <button
              type="submit"
              className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                checkpoint.completed
                  ? "border-gray-200 text-gray-500 hover:bg-gray-50"
                  : "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {checkpoint.completed ? "Mark Incomplete" : "Mark Complete"}
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
