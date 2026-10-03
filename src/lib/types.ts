export type ReturnReason =
  | "TOO_SMALL"
  | "TOO_LARGE"
  | "DAMAGED"
  | "DEFECTIVE"
  | "WRONG_ITEM"
  | "NOT_AS_EXPECTED"
  | "CHANGED_MIND"
  | "OTHER";

export type ReturnOutcome =
  | "APPROVED"
  | "MORE_INFO_REQUIRED"
  | "SELLER_REVIEW"
  | "NOT_ELIGIBLE";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type DemoOrder = {
  id: string;
  orderItemId?: string;
  product: string;
  price: number;
  deliveredAt: string;
  image: string;
  status: "DELIVERED" | "PROCESSING";
};

export type ReturnCase = {
  id: string;
  orderId: string;
  customer: string;
  product: string;
  amount: number;
  reason: string;
  status: "Needs review" | "Approved" | "More info" | "Not eligible";
  risk: RiskLevel;
  policy: "Eligible" | "Not eligible";
  history: string;
  evidence: string;
  recommendation: string;
  evidenceImageUrl?: string;
  customerMessage?: string;
  requestedResolution?: string;
};
