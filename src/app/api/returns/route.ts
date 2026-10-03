import { NextResponse } from "next/server";
import { evaluateReturn } from "@/lib/return-engine";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import type { ReturnReason } from "@/lib/types";

const reasons = new Set<ReturnReason>(["TOO_SMALL", "TOO_LARGE", "DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_EXPECTED", "CHANGED_MIND", "OTHER"]);
const resolutions = new Set(["refund", "replacement", "exchange"]);

type OrderItemRow = {
  id: string;
  unit_price: number;
  product: { is_final_sale: boolean } | null;
  order: { customer_id: string; delivered_at: string | null; status: string } | null;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const user = await getCurrentProfile();
  if (!user || user.role !== "customer") return NextResponse.json({ error: "Please sign in as a customer before creating a return." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.orderItemId !== "string" || !reasons.has(body.reason as ReturnReason) || !resolutions.has(body.requestedResolution as string)) {
    return NextResponse.json({ error: "Invalid return request." }, { status: 400 });
  }

  const { data, error: orderError } = await supabase
    .from("order_items")
    .select("id, unit_price, product:products(is_final_sale), order:orders!inner(customer_id, delivered_at, status)")
    .eq("id", body.orderItemId)
    .single();
  const item = data as unknown as OrderItemRow | null;
  if (orderError || !item?.order || item.order.customer_id !== user.id || item.order.status !== "DELIVERED" || !item.order.delivered_at) {
    return NextResponse.json({ error: "That delivered order could not be verified." }, { status: 403 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 60);
  const [{ count: recentReturns }, { count: recentDamageClaims }] = await Promise.all([
    supabase.from("return_cases").select("id", { count: "exact", head: true }).eq("customer_id", user.id).gte("created_at", since.toISOString()),
    supabase.from("return_cases").select("id", { count: "exact", head: true }).eq("customer_id", user.id).in("reason", ["DAMAGED", "DEFECTIVE"]).gte("created_at", since.toISOString())
  ]);
  const hasEvidence = Boolean(body.hasEvidence);
  const evidenceAssessment = body.evidenceAssessment === "yes" || body.evidenceAssessment === "no" || body.evidenceAssessment === "unclear" ? body.evidenceAssessment : undefined;
  const evidenceObservation = typeof body.evidenceObservation === "string" ? body.evidenceObservation.slice(0, 1000) : null;
  const imageComparison = ["match", "mismatch", "unclear", "not_applicable"].includes(body.imageComparison as string)
    ? body.imageComparison as string
    : null;
  const aiSource = body.aiSource === "claude" || body.aiSource === "template" ? body.aiSource : null;
  const aiModel = typeof body.aiModel === "string" ? body.aiModel.slice(0, 120) : null;
  const { data: existingCase } = await supabase
    .from("return_cases")
    .select("display_id")
    .eq("order_item_id", item.id)
    .in("status", ["REQUESTED", "MORE_INFO_REQUIRED", "UNDER_REVIEW", "APPROVED", "RETURNING", "RECEIVED", "REFUNDED"])
    .maybeSingle();
  if (existingCase) return NextResponse.json({ error: `An active return already exists for this item (${existingCase.display_id}).` }, { status: 409 });
  const evaluation = evaluateReturn({
    deliveredAt: new Date(item.order.delivered_at), isFinalSale: Boolean(item.product?.is_final_sale), amount: Number(item.unit_price),
    reason: body.reason as ReturnReason, hasEvidence, evidenceAssessment, recentReturns: recentReturns ?? 0, recentDamageClaims: recentDamageClaims ?? 0
  });
  const displayId = `RET-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const status = evaluation.outcome === "APPROVED" ? "APPROVED" : evaluation.outcome === "MORE_INFO_REQUIRED" ? "MORE_INFO_REQUIRED" : evaluation.outcome === "NOT_ELIGIBLE" ? "REJECTED" : "UNDER_REVIEW";
  const decisionSummary = [
    ...evaluation.reasons,
    evidenceObservation ? `Visual review: ${evidenceObservation}` : null,
    imageComparison && imageComparison !== "not_applicable" ? `Catalog comparison: ${imageComparison}.` : null,
  ].filter(Boolean).join(" ");
  const { data: created, error: createError } = await supabase.from("return_cases").insert({
    display_id: displayId, order_item_id: item.id, customer_id: user.id, requested_resolution: body.requestedResolution,
    customer_message: typeof body.customerMessage === "string" ? body.customerMessage.slice(0, 2000) : null,
    reason: body.reason, outcome: evaluation.outcome, status, risk_level: evaluation.riskLevel,
    policy_result: evaluation.outcome === "NOT_ELIGIBLE" ? "Not eligible" : "Eligible",
    decision_reasons: evaluation.reasons,
    ai_evidence_observation: evidenceObservation,
    ai_evidence_source: aiSource,
    ai_model: aiModel,
    image_comparison: imageComparison ? { result: imageComparison } : null,
    ai_summary: decisionSummary || null,
  }).select("id, display_id").single();
  if (createError || !created) return NextResponse.json({ error: "Unable to save the return request." }, { status: 500 });

  if (typeof body.evidencePath === "string" && body.evidencePath.startsWith(`${user.id}/`)) {
    const { error: evidenceError } = await supabase.from("return_evidence").insert({ return_case_id: created.id, storage_path: body.evidencePath, mime_type: typeof body.evidenceContentType === "string" ? body.evidenceContentType : "image/jpeg", assessment: typeof body.evidenceAssessment === "string" ? body.evidenceAssessment : null });
    if (evidenceError) return NextResponse.json({ error: "Return was created but its photo could not be attached. Contact support with case ID " + created.display_id + "." }, { status: 500 });
  }
  await supabase.from("return_events").insert({ return_case_id: created.id, status, message: decisionSummary || evaluation.reasons.join(" ") });
  return NextResponse.json({ id: created.id, displayId: created.display_id, ...evaluation }, { status: 201 });
}
