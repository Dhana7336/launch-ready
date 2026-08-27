import type { RiskLevel } from "@/types/product";

// Single source for risk copy/color so the pill badge (components/risk-badge.tsx) and
// any other risk display (e.g. the product spec grid) never drift out of sync.
export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
};

export const RISK_BADGE_TINT: Record<RiskLevel, string> = {
  LOW: "bg-risk-low-bg text-risk-low-ink",
  MEDIUM: "bg-risk-medium-bg text-risk-medium-ink",
  HIGH: "bg-risk-high-bg text-risk-high-ink",
};

export const RISK_TEXT_TINT: Record<RiskLevel, string> = {
  LOW: "text-risk-low-ink",
  MEDIUM: "text-risk-medium-ink",
  HIGH: "text-risk-high-ink",
};
