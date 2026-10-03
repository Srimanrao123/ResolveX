import type { ReturnOutcome, ReturnReason, RiskLevel } from "@/lib/types";

export type ReturnEvaluationInput = {
  deliveredAt: Date;
  isFinalSale: boolean;
  amount: number;
  reason: ReturnReason;
  hasEvidence: boolean;
  evidenceAssessment?: "yes" | "no" | "unclear";
  recentReturns: number;
  recentDamageClaims: number;
  now?: Date;
};

export type ReturnEvaluation = {
  outcome: ReturnOutcome;
  riskLevel: RiskLevel;
  reasons: string[];
};

export function evaluateReturn(input: ReturnEvaluationInput): ReturnEvaluation {
  const now = input.now ?? new Date();
  const daysSinceDelivery = Math.floor((now.getTime() - input.deliveredAt.getTime()) / 86_400_000);
  const isDamageClaim = input.reason === "DAMAGED" || input.reason === "DEFECTIVE";

  if (input.isFinalSale || daysSinceDelivery > 30) {
    return { outcome: "NOT_ELIGIBLE", riskLevel: "LOW", reasons: [input.isFinalSale ? "This item is final sale." : "This request is outside the 30-day return window."] };
  }
  if (isDamageClaim && !input.hasEvidence) {
    return { outcome: "MORE_INFO_REQUIRED", riskLevel: "LOW", reasons: ["Please upload a photo showing the damaged or defective area."] };
  }

  const riskSignals: string[] = [];
  if (input.recentReturns >= 3) riskSignals.push("Customer has 3 or more recent returns.");
  if (input.recentDamageClaims >= 2) riskSignals.push("Customer has repeated damage-related claims.");
  if (input.amount > 5000) riskSignals.push("Order value is above the auto-approval threshold.");
  if (isDamageClaim && input.evidenceAssessment !== "yes") riskSignals.push("Evidence does not clearly support the claim.");
  if (riskSignals.length > 0) {
    return { outcome: "SELLER_REVIEW", riskLevel: riskSignals.length >= 2 ? "HIGH" : "MEDIUM", reasons: riskSignals };
  }
  return { outcome: "APPROVED", riskLevel: "LOW", reasons: ["Order is eligible, required information is complete, and no elevated risk signals were found."] };
}
