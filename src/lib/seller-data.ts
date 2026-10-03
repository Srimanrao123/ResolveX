import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import type { ReturnCase, RiskLevel } from "@/lib/types";

type CaseRow = {
  id?: string;
  display_id: string;
  reason: string;
  status: string;
  risk_level: RiskLevel;
  policy_result: string | null;
  ai_summary: string | null;
  evidence_assessment: string | null;
  customer_message?: string | null;
  requested_resolution?: string | null;
  customer: { full_name: string | null } | null;
  item: { unit_price: number; product: { name: string } | null; order: { display_id: string } | null } | null;
  return_evidence?: { storage_path: string; mime_type: string }[] | null;
};

function normalize(row: CaseRow, evidenceImageUrl?: string): ReturnCase {
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
    recommendation: row.ai_summary || "Review the policy result, evidence, and return history before deciding.",
    evidenceImageUrl,
    customerMessage: row.customer_message || undefined,
    requestedResolution: row.requested_resolution || undefined,
  };
}

export async function getSellerCases(): Promise<{ cases: ReturnCase[]; isDemo: boolean }> {
  const supabase = getSupabaseAdminClient();
  const user = await getCurrentProfile();
  if (!supabase || user?.role !== "seller") return { cases: [], isDemo: false };
  const { data, error } = await supabase
    .from("return_cases")
    .select("id, display_id, reason, status, risk_level, policy_result, ai_summary, evidence_assessment, customer_message, requested_resolution, customer:profiles(full_name), item:order_items(unit_price, product:products(name), order:orders(display_id)), return_evidence(storage_path, mime_type)")
    .order("created_at", { ascending: false });
  if (error || !data?.length) return { cases: [], isDemo: false };

  const rows = data as unknown as CaseRow[];
  const cases = await Promise.all(
    rows.map(async (row) => {
      let evidenceImageUrl: string | undefined;
      const storagePath = row.return_evidence?.[0]?.storage_path;
      if (storagePath) {
        const { data: signed } = await supabase.storage.from("return-evidence").createSignedUrl(storagePath, 3600);
        if (signed?.signedUrl) {
          evidenceImageUrl = signed.signedUrl;
        }
      }
      return normalize(row, evidenceImageUrl);
    })
  );

  return { cases, isDemo: false };
}

export async function getSellerCaseById(id: string): Promise<ReturnCase | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("return_cases")
    .select("id, display_id, reason, status, risk_level, policy_result, ai_summary, evidence_assessment, customer_message, requested_resolution, customer:profiles(full_name), item:order_items(unit_price, product:products(name), order:orders(display_id)), return_evidence(storage_path, mime_type)")
    .or(`display_id.eq.${id},id.eq.${id}`)
    .maybeSingle();

  if (data) {
    const row = data as unknown as CaseRow;
    let evidenceImageUrl: string | undefined;
    const storagePath = row.return_evidence?.[0]?.storage_path;
    if (storagePath) {
      const { data: signed } = await supabase.storage.from("return-evidence").createSignedUrl(storagePath, 3600);
      evidenceImageUrl = signed?.signedUrl;
    }
    return normalize(row, evidenceImageUrl);
  }

  return null;
}

export function getDashboardMetrics(cases: ReturnCase[]) {
  const review = cases.filter(item => item.status === "Needs review");
  const approved = cases.filter(item => item.status === "Approved");
  const highRisk = cases.filter(item => item.risk === "HIGH");
  return { total: cases.length, approvedPercent: cases.length ? Math.round((approved.length / cases.length) * 100) : 0, review: review.length, highRisk: highRisk.length };
}

export type SellerOrderRow = {
  id: string;
  displayId: string;
  status: string;
  deliveredAt: string | null;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  items: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string;
  }[];
};

export async function getSellerOrders(): Promise<SellerOrderRow[]> {
  const supabase = getSupabaseAdminClient();
  const user = await getCurrentProfile();
  if (!supabase || user?.role !== "seller") return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      display_id,
      status,
      delivered_at,
      created_at,
      customer:profiles ( email, full_name ),
      order_items (
        id,
        quantity,
        unit_price,
        product:products ( name, image_url )
      )
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((o) => {
    const items = (o.order_items ?? []).map((oi: any) => ({
      id: oi.id,
      productName: oi.product?.name ?? "Product",
      quantity: oi.quantity ?? 1,
      unitPrice: Number(oi.unit_price ?? 0),
      imageUrl: oi.product?.image_url,
    }));
    const totalAmount = items.reduce(
      (sum: number, it: any) => sum + it.unitPrice * it.quantity,
      0
    );

    return {
      id: o.id,
      displayId: o.display_id,
      status: o.status,
      deliveredAt: o.delivered_at,
      createdAt: o.created_at,
      customerEmail: o.customer?.email ?? "Customer",
      customerName: o.customer?.full_name ?? o.customer?.email?.split("@")[0] ?? "Customer",
      totalAmount,
      items,
    };
  });
}
