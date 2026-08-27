import type { RiskLevel } from "@/types/product";
import { RISK_BADGE_TINT, RISK_LABEL } from "@/lib/risk-style";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_BADGE_TINT[risk]}`}
    >
      {RISK_LABEL[risk]}
    </span>
  );
}
