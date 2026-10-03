import { reviewCases } from "@/lib/demo-data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import type { ReturnCase, RiskLevel } from "@/lib/types";

type CaseRow = {
  display_id: string;
  reason: string;
  status: string;
  risk_level: RiskLevel;
  policy_result: string | null;
  ai_summary: string | null;
  evidence_assessment: string | null;
  customer: { full_name: string | null } | null;
  item: { unit_price: number; product: { name: string } | null; order: { display_id: string } | null } | null;
};

function normalize(row: CaseRow): ReturnCase {
  const statusMap: Record<string, ReturnCase["status"]> = { APPROVED: "Approved", MORE_INFO_REQUIRED: "More info", REJECTED: "Not eligible", UNDER_REVIEW: "Needs review" };
  return {
    id: row.display_id,
    orderId: row.item?.order?.display_id ?? "—",
    customer: row.customer?.full_name || "Customer",
    product: row.item?.product?.name ?? "Product",
    amount: Number(row.item?.unit_price ?? 0),
    reason: row.reason.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()),
    status: statusMap[row.status] ?? "Needs review",
    risk: row.risk_level,
    policy: row.policy_result === "Not eligible" ? "Not eligible" : "Eligible",
    history: "Return history is available in the case review.",
    evidence: row.evidence_assessment || "No evidence assessment available.",
    recommendation: row.ai_summary || "Review the policy result, evidence, and return history before deciding."
  };
}

export async function getSellerCases(): Promise<{ cases: ReturnCase[]; isDemo: boolean }> {
  const supabase = getSupabaseAdminClient();
  const user = await getCurrentProfile();
  if (!supabase || user?.role !== "seller") return { cases: reviewCases, isDemo: true };
  const { data, error } = await supabase
    .from("return_cases")
    .select("display_id, reason, status, risk_level, policy_result, ai_summary, evidence_assessment, customer:profiles(full_name), item:order_items(unit_price, product:products(name), order:orders(display_id))")
    .order("created_at", { ascending: false });
  if (error || !data?.length) return { cases: reviewCases, isDemo: true };
  return { cases: (data as unknown as CaseRow[]).map(normalize), isDemo: false };
}

export function getDashboardMetrics(cases: ReturnCase[]) {
  const review = cases.filter(item => item.status === "Needs review");
  const approved = cases.filter(item => item.status === "Approved");
  const highRisk = cases.filter(item => item.risk === "HIGH");
  return { total: cases.length, approvedPercent: cases.length ? Math.round((approved.length / cases.length) * 100) : 0, review: review.length, highRisk: highRisk.length };
}
