import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import type { ReturnCase } from "@/lib/types";

const decisions = new Set(["approve", "reject", "request_info", "mark_returning", "mark_received", "mark_refunded"]);

const statusMap: Record<string, ReturnCase["status"]> = {
  approve: "Approved",
  reject: "Not eligible",
  request_info: "More info",
  mark_returning: "Returning",
  mark_received: "Received",
  mark_refunded: "Refunded",
};

const dbStatusMap: Record<string, { status: string; outcome: string }> = {
  approve: { status: "APPROVED", outcome: "APPROVED" },
  reject: { status: "REJECTED", outcome: "NOT_ELIGIBLE" },
  request_info: { status: "MORE_INFO_REQUIRED", outcome: "MORE_INFO_REQUIRED" },
  mark_returning: { status: "RETURNING", outcome: "APPROVED" },
  mark_received: { status: "RECEIVED", outcome: "APPROVED" },
  mark_refunded: { status: "REFUNDED", outcome: "APPROVED" },
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentProfile();
  if (user?.role !== "seller" || user.email !== "srimanrao0707@gmail.com") {
    return NextResponse.json({ error: "Seller access is restricted to the approved account." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { decision?: string; note?: string; refundReference?: string } | null;
  if (!body?.decision || !decisions.has(body.decision)) {
    return NextResponse.json({ error: "Invalid seller decision." }, { status: 400 });
  }

  const { id } = await params;
  const update = dbStatusMap[body.decision];
  const targetUiStatus = statusMap[body.decision];
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const existingQuery = supabase.from("return_cases").select("id, display_id, status, requested_resolution, order_item:order_items(unit_price)");
    const { data: existing } = await (isUuid ? existingQuery.eq("id", id) : existingQuery.eq("display_id", id)).maybeSingle();
    if (!existing) return NextResponse.json({ error: "Return case was not found." }, { status: 404 });
    const allowedFrom: Record<string, string[]> = {
      approve: ["UNDER_REVIEW", "MORE_INFO_REQUIRED"],
      reject: ["UNDER_REVIEW", "MORE_INFO_REQUIRED"],
      request_info: ["UNDER_REVIEW", "APPROVED"],
      mark_returning: ["APPROVED"],
      mark_received: ["RETURNING", "APPROVED"],
      mark_refunded: ["RECEIVED"],
    };
    if (!allowedFrom[body.decision].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot ${body.decision.replaceAll("_", " ")} while this return is ${existing.status.replaceAll("_", " ")}.` }, { status: 409 });
    }
    if (["approve", "reject", "request_info"].includes(body.decision) && !body.note?.trim()) {
      return NextResponse.json({ error: "Add a short decision note for the customer and audit trail." }, { status: 400 });
    }
    if (body.decision === "mark_refunded" && !body.refundReference?.trim()) {
      return NextResponse.json({ error: "Enter the payment-provider or manual refund reference." }, { status: 400 });
    }
    const refundReference = body.refundReference?.trim() ?? "";
    const updateData = {
      ...update,
      seller_decision_note: body.note?.trim().slice(0, 2000) || null,
      seller_decided_at: new Date().toISOString(),
    };
    const query = supabase.from("return_cases").update(updateData);
    const { data: returnCase, error } = await (
      isUuid ? query.eq("id", id) : query.eq("display_id", id)
    )
      .select("id, display_id, status")
      .maybeSingle();

    if (!error && returnCase) {
      const amount = Number((existing.order_item as unknown as { unit_price?: number } | null)?.unit_price ?? 0);
      if (body.decision === "mark_received" && existing.requested_resolution === "refund") {
        await supabase.from("refunds").upsert({ return_case_id: existing.id, amount, status: "PENDING_MANUAL", provider: "manual", note: "Item received; awaiting refund processing." }, { onConflict: "return_case_id" });
      }
      if (body.decision === "mark_refunded") {
        await supabase.from("refunds").upsert({ return_case_id: existing.id, amount, status: "REFUNDED", provider: "manual", provider_reference: refundReference.slice(0, 300), note: body.note?.trim().slice(0, 2000) || null, completed_at: new Date().toISOString() }, { onConflict: "return_case_id" });
      }
      await supabase.from("return_events").insert({
        return_case_id: returnCase.id,
        status: update.status,
        message: `${body.decision.replaceAll("_", " ")}. ${body.note?.trim() || (body.decision === "mark_received" ? "Refund is queued for manual processing." : body.decision === "mark_refunded" ? `Refund reference: ${refundReference}.` : "")}`.trim(),
      });
      return NextResponse.json({
        returnCase,
        status: targetUiStatus,
        message: `Return ${body.decision.replace("_", " ")}ed successfully.`,
      });
    }
  }

  return NextResponse.json({ error: "Return case was not found." }, { status: 404 });
}
