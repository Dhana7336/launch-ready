import type { RiskLevel } from "@/types/product";
import { RISK_LABEL, RISK_TEXT_TINT } from "@/lib/risk-style";

// Editorial metadata/spec grid: tiny muted uppercase labels, larger serif values,
// bounded top and bottom by a rule — matches the rest of the homepage's editorial voice
// rather than looking like separate dashboard cards.
export function ProductSpecGrid({
  launchDate,
  owner,
  readiness,
  risk,
}: {
  launchDate: string;
  owner: string;
  readiness: number;
  risk: RiskLevel;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-border py-8 sm:grid-cols-4 sm:gap-x-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Launch Date</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap text-ink">
          {launchDate}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Owner</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap text-ink">
          {owner}
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Readiness</p>
        <p
          data-testid="readiness-value"
          className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap text-ink"
        >
          {readiness}%
        </p>
        <div
          className="mt-3 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-sand"
          role="progressbar"
          aria-valuenow={readiness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Readiness"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${readiness}%` }}
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">Launch Risk</p>
        <p
          data-testid="risk-value"
          className={`mt-2 font-[family-name:var(--font-display)] text-xl font-semibold whitespace-nowrap ${RISK_TEXT_TINT[risk]}`}
        >
          {RISK_LABEL[risk]}
        </p>
      </div>
    </div>
  );
}
