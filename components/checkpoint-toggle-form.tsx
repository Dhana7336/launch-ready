"use client";

import { useActionState } from "react";
import type { Checkpoint } from "@/types/product";
import { toggleCheckpoint, type ToggleCheckpointState } from "@/app/actions";

const INITIAL_STATE: ToggleCheckpointState = { status: "idle" };

// Owns the <form> itself (useActionState requires this) rather than just wrapping a
// button — that's what makes the action's returned error state available to render here.
// Replaces the old checkpoint-submit-button.tsx, which only had useFormStatus's pending
// flag to work with; useActionState's own pending flag covers that same need, so there's
// no reason to keep a separate useFormStatus child component around.
export function CheckpointToggleForm({
  productId,
  checkpoint,
}: {
  productId: string;
  checkpoint: Checkpoint;
}) {
  const [state, formAction, isPending] = useActionState(
    toggleCheckpoint.bind(null, productId, checkpoint.id),
    INITIAL_STATE
  );

  const errorId = `${checkpoint.id}-toggle-error`;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={isPending}
        aria-label={`${checkpoint.completed ? "Completed" : "Pending"} — mark ${checkpoint.label} as ${checkpoint.completed ? "incomplete" : "complete"}`}
        aria-describedby={state.status === "error" ? errorId : undefined}
        className={`shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60 ${
          checkpoint.completed
            ? "border-border text-muted hover:bg-surface-muted"
            : "border-primary bg-primary text-sidebar-ink hover:bg-primary-hover"
        }`}
      >
        {isPending ? "Saving…" : checkpoint.completed ? "Completed" : "Pending"}
      </button>
      {state.status === "error" && (
        <p id={errorId} role="alert" className="text-xs text-risk-high-ink">
          {state.message}
        </p>
      )}
    </form>
  );
}
