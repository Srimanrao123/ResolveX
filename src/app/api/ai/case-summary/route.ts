import { NextResponse } from "next/server";
import { createCaseSummary } from "@/lib/claude";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.product !== "string" || typeof body.reason !== "string" || !Array.isArray(body.riskSignals)) {
    return NextResponse.json({ error: "Invalid summary request." }, { status: 400 });
  }
  const result = await createCaseSummary({
    product: body.product,
    reason: body.reason,
    policyResult: typeof body.policyResult === "string" ? body.policyResult : "Policy result unavailable.",
    riskSignals: body.riskSignals.filter((value): value is string => typeof value === "string").slice(0, 8),
    evidenceAssessment: typeof body.evidenceAssessment === "string" ? body.evidenceAssessment : "No evidence assessment available.",
    recommendation: typeof body.recommendation === "string" ? body.recommendation : "Seller review recommended."
  });
  return NextResponse.json(result);
}
