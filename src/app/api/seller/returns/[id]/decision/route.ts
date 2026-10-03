import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import type { ReturnCase } from "@/lib/types";

const decisions = new Set(["approve", "reject", "request_info"]);

const statusMap: Record<string, ReturnCase["status"]> = {
  approve: "Approved",
  reject: "Not eligible",
  request_info: "More info",
};

const dbStatusMap: Record<string, { status: string; outcome: string }> = {
  approve: { status: "APPROVED", outcome: "APPROVED" },
  reject: { status: "REJECTED", outcome: "NOT_ELIGIBLE" },
  request_info: { status: "MORE_INFO_REQUIRED", outcome: "MORE_INFO_REQUIRED" },
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentProfile();
  if (user?.role !== "seller" || user.email !== "srimanrao0707@gmail.com") {
    return NextResponse.json({ error: "Seller access is restricted to the approved account." }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { decision?: string } | null;
  if (!body?.decision || !decisions.has(body.decision)) {
    return NextResponse.json({ error: "Invalid seller decision." }, { status: 400 });
  }

  const { id } = await params;
  const update = dbStatusMap[body.decision];
  const targetUiStatus = statusMap[body.decision];
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const query = supabase.from("return_cases").update(update);
    const { data: returnCase, error } = await (
      isUuid ? query.eq("id", id) : query.eq("display_id", id)
    )
      .select("id, display_id, status")
      .maybeSingle();

    if (!error && returnCase) {
      await supabase.from("return_events").insert({
        return_case_id: returnCase.id,
        status: update.status,
        message: `Seller decision: ${body.decision.replace("_", " ")}.`,
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
