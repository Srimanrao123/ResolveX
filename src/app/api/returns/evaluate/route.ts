import { NextResponse } from "next/server";
import { evaluateReturn } from "@/lib/return-engine";
import type { ReturnReason } from "@/lib/types";

const allowedReasons = new Set<ReturnReason>(["TOO_SMALL", "TOO_LARGE", "DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_EXPECTED", "CHANGED_MIND", "OTHER"]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.deliveredAt !== "string" || !allowedReasons.has(body.reason as ReturnReason)) {
    return NextResponse.json({ error: "Invalid return request." }, { status: 400 });
  }
  const deliveredAt = new Date(body.deliveredAt);
  if (Number.isNaN(deliveredAt.getTime())) return NextResponse.json({ error: "Invalid delivery date." }, { status: 400 });

  const evaluation = evaluateReturn({
    deliveredAt,
    isFinalSale: Boolean(body.isFinalSale),
    amount: typeof body.amount === "number" ? body.amount : 0,
    reason: body.reason as ReturnReason,
    hasEvidence: Boolean(body.hasEvidence),
    evidenceAssessment: body.evidenceAssessment === "yes" || body.evidenceAssessment === "no" || body.evidenceAssessment === "unclear" ? body.evidenceAssessment : undefined,
    recentReturns: typeof body.recentReturns === "number" ? body.recentReturns : 0,
    recentDamageClaims: typeof body.recentDamageClaims === "number" ? body.recentDamageClaims : 0
  });
  return NextResponse.json(evaluation);
}
