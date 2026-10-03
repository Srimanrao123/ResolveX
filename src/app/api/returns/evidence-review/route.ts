import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import { needsItemComparison } from "@/lib/return-engine";
import type { ReturnReason } from "@/lib/types";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const visualReasons = new Set<ReturnReason>(["DAMAGED", "DEFECTIVE", "WRONG_ITEM", "NOT_AS_EXPECTED"]);

async function fetchProductImage(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    const response = await fetch(parsed, { signal: AbortSignal.timeout(8_000) });
    const contentType = response.headers.get("content-type")?.split(";")[0] ?? "";
    if (!response.ok || !allowedTypes.has(contentType)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 5 * 1024 * 1024) return null;
    return { contentType, data: bytes.toString("base64") };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const user = await getCurrentProfile();
  if (!user || user.role !== "customer") return NextResponse.json({ error: "Please sign in before reviewing evidence." }, { status: 401 });
  const body = await request.json().catch(() => null) as { evidencePath?: string; contentType?: string; reason?: ReturnReason; orderItemId?: string } | null;
  if (!body?.evidencePath || !body.contentType || !body.reason || !visualReasons.has(body.reason) || !allowedTypes.has(body.contentType) || !body.evidencePath.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Invalid evidence reference." }, { status: 400 });
  const { data: image, error } = await supabase.storage.from("return-evidence").download(body.evidencePath);
  if (error || !image || image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Evidence image could not be read." }, { status: 422 });
  const fallback = { supportsClaim: "unclear", observation: "Evidence requires seller review.", comparison: null, model: null };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ...fallback, source: "template" });
  let productImage: { contentType: string; data: string } | null = null;
  if (needsItemComparison(body.reason) && body.orderItemId) {
    const { data: item } = await supabase
      .from("order_items")
      .select("product:products(image_url), order:orders!inner(customer_id)")
      .eq("id", body.orderItemId)
      .eq("order.customer_id", user.id)
      .maybeSingle();
    const imageUrl = (item as { product?: { image_url?: string | null } | null } | null)?.product?.image_url;
    if (imageUrl) productImage = await fetchProductImage(imageUrl);
  }
  const userImage = Buffer.from(await image.arrayBuffer()).toString("base64");
  const compare = Boolean(productImage && needsItemComparison(body.reason));
  const content: Array<Record<string, unknown>> = [
    { type: "image", source: { type: "base64", media_type: body.contentType, data: userImage } },
    { type: "text", text: compare
      ? `The first image is the customer-uploaded received item. The second image is the catalog image for the purchased product. Customer return reason: ${body.reason}. Compare only visible product characteristics. Reply exactly with three lines: SUPPORTS: yes, no, or unclear; OBSERVATION: one concise sentence; COMPARISON: match, mismatch, or unclear.`
      : `Customer return reason: ${body.reason}. Does the visible image appear consistent with this claim? Reply exactly with three lines: SUPPORTS: yes, no, or unclear; OBSERVATION: one concise sentence; COMPARISON: not_applicable.` },
  ];
  if (productImage) content.push({ type: "image", source: { type: "base64", media_type: productImage.contentType, data: productImage.data } });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 140,
      system: "Assess only visible e-commerce return evidence. Do not identify people, infer protected traits, or accuse anyone of fraud. State uncertainty when the images do not show enough detail.",
      messages: [{ role: "user", content }]
    })
  });
  if (!response.ok) return NextResponse.json({ ...fallback, source: "template" });
  const payload = await response.json() as { content?: { type: string; text?: string }[] };
  const text = payload.content?.find(block => block.type === "text")?.text ?? "";
  const supportsClaim = /SUPPORTS:\s*(yes|no|unclear)/i.exec(text)?.[1]?.toLowerCase() ?? "unclear";
  const observation = /OBSERVATION:\s*(.+)/i.exec(text)?.[1]?.trim() || fallback.observation;
  const comparison = /COMPARISON:\s*(match|mismatch|unclear|not_applicable)/i.exec(text)?.[1]?.toLowerCase() ?? (compare ? "unclear" : "not_applicable");
  return NextResponse.json({ supportsClaim, observation, comparison, comparisonAvailable: compare, source: "claude", model: "claude-haiku-4-5-20251001" });
}
