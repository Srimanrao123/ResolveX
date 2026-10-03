import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";

const decisions = new Set(["approve", "reject", "request_info"]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const user = await getCurrentProfile();
  if (user?.role !== "seller" || user.email !== "srimanrao0707@gmail.com") return NextResponse.json({ error: "Seller access is restricted to the approved account." }, { status: 403 });
  const body = await request.json().catch(() => null) as { decision?: string } | null;
  if (!body?.decision || !decisions.has(body.decision)) return NextResponse.json({ error: "Invalid seller decision." }, { status: 400 });
  const { id } = await params;
  const update = body.decision === "approve" ? { status: "APPROVED", outcome: "APPROVED" } : body.decision === "reject" ? { status: "REJECTED", outcome: "NOT_ELIGIBLE" } : { status: "MORE_INFO_REQUIRED", outcome: "MORE_INFO_REQUIRED" };
  const { data: returnCase, error } = await supabase.from("return_cases").update(update).eq("display_id", id).select("id, display_id, status").single();
  if (error || !returnCase) return NextResponse.json({ error: "Return case was not found." }, { status: 404 });
  await supabase.from("return_events").insert({ return_case_id: returnCase.id, status: update.status, message: `Seller decision: ${body.decision.replace("_", " ")}.` });
  return NextResponse.json({ returnCase });
}
