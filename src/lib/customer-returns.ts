import { getCurrentProfile } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

export async function getCustomerReturn(idOrDisplayId: string) {
  const profile = await getCurrentProfile();
  const supabase = getSupabaseAdminClient();
  if (!profile || profile.role !== "customer" || !supabase) return null;

  const cleanId = idOrDisplayId.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  const query = supabase
    .from("return_cases")
    .select(`
      id,
      display_id,
      status,
      outcome,
      risk_level,
      policy_result,
      requested_resolution,
      customer_message,
      created_at,
      order_item:order_items (
        unit_price,
        product:products ( name, image_url ),
        order:orders ( display_id )
      )
    `)
    .eq("customer_id", profile.id);

  const { data: returnCase, error } = await (
    isUuid ? query.eq("id", cleanId) : query.ilike("display_id", cleanId)
  ).maybeSingle();

  if (error || !returnCase) return null;
  const { data: events } = await supabase
    .from("return_events")
    .select("status, message, created_at")
    .eq("return_case_id", returnCase.id)
    .order("created_at", { ascending: true });

  const item = (returnCase as any).order_item;

  return {
    ...returnCase,
    productName: item?.product?.name ?? "Purchased item",
    productImage: item?.product?.image_url ?? null,
    orderDisplayId: item?.order?.display_id ?? null,
    amount: item?.unit_price ? Number(item.unit_price) : null,
    events: events ?? [],
  };
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

    const cleanOrder = orderId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrder);
    const query = supabase
      .from("return_cases")
      .select(`
        id, display_id, status, outcome, risk_level, policy_result, created_at,
        order_item:order_items!inner(order:orders!inner(id, display_id))
      `)
      .eq("customer_id", profile.id);

    const { data: byOrder } = await (
      isUuid
        ? query.eq("order_item.order.id", cleanOrder)
        : query.ilike("order_item.order.display_id", cleanOrder)
    )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byOrder) return byOrder;
  }

  return null;
}
