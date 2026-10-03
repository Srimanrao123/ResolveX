import { getCurrentProfile } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { reviewCases } from "@/lib/demo-data";

export type CustomerReturnCaseItem = {
  id: string;
  displayId: string;
  status: string;
  outcome: string | null;
  riskLevel: string;
  policyResult: string | null;
  createdAt: string;
  productName: string;
  orderItemId?: string;
  orderDisplayId?: string;
};

export async function getCustomerReturn(displayId: string) {
  const profile = await getCurrentProfile();
  const supabase = getSupabaseAdminClient();
  if (!profile || profile.role !== "customer" || !supabase) return null;
  const { data: returnCase } = await supabase
    .from("return_cases")
    .select("id, display_id, status, outcome, risk_level, policy_result, created_at")
    .eq("display_id", displayId)
    .eq("customer_id", profile.id)
    .maybeSingle();
  if (!returnCase) return null;
  const { data: events } = await supabase
    .from("return_events")
    .select("status, message, created_at")
    .eq("return_case_id", returnCase.id)
    .order("created_at", { ascending: true });
  return { ...returnCase, events: events ?? [] };
}

export async function getCustomerReturnCases(): Promise<CustomerReturnCaseItem[]> {
  const profile = await getCurrentProfile();
  const supabase = getSupabaseAdminClient();
  if (!profile || profile.role !== "customer" || !supabase) return [];
  const { data, error } = await supabase
    .from("return_cases")
    .select(`
      id,
      display_id,
      status,
      outcome,
      risk_level,
      policy_result,
      created_at,
      order_item_id,
      order_item:order_items (
        product:products ( name ),
        order:orders ( display_id )
      )
    `)
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as any[]).map((rc) => ({
    id: rc.id,
    displayId: rc.display_id,
    status: rc.status,
    outcome: rc.outcome,
    riskLevel: rc.risk_level,
    policyResult: rc.policy_result,
    createdAt: rc.created_at,
    orderItemId: rc.order_item_id,
    productName: rc.order_item?.product?.name ?? "Purchased item",
    orderDisplayId: rc.order_item?.order?.display_id ?? undefined,
  }));
}

export async function getCustomerReturnForOrder(orderId: string, orderItemId?: string) {
  const profile = await getCurrentProfile();
  const supabase = getSupabaseAdminClient();

  if (supabase && profile?.role === "customer") {
    if (orderItemId) {
      const { data } = await supabase
        .from("return_cases")
        .select("id, display_id, status, outcome, risk_level, policy_result, created_at")
        .eq("order_item_id", orderItemId)
        .eq("customer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) return data;
    }

    const { data: byOrder } = await supabase
      .from("return_cases")
      .select(`
        id, display_id, status, outcome, risk_level, policy_result, created_at,
        order_item:order_items!inner(order:orders!inner(display_id))
      `)
      .eq("customer_id", profile.id)
      .eq("order_item.order.display_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byOrder) return byOrder;
  }

  // Demo fallback
  const demoCase = reviewCases.find(
    (c) => c.orderId === orderId || (orderItemId && c.id === orderItemId)
  );
  if (demoCase) {
    return {
      id: demoCase.id,
      display_id: demoCase.id,
      status: demoCase.status === "Approved" ? "APPROVED" : "UNDER_REVIEW",
      outcome: demoCase.status === "Approved" ? "APPROVED" : "SELLER_REVIEW",
      risk_level: demoCase.risk,
      policy_result: demoCase.policy,
      created_at: new Date().toISOString(),
    };
  }

  return null;
}
