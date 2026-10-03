import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const user = await getCurrentProfile();
  if (!user || user.role !== "customer") return NextResponse.json({ error: "Please sign in before reviewing evidence." }, { status: 401 });
  const body = await request.json().catch(() => null) as { evidencePath?: string; contentType?: string; reason?: string } | null;
  if (!body?.evidencePath || !body.contentType || !allowedTypes.has(body.contentType) || !body.evidencePath.startsWith(`${user.id}/`)) return NextResponse.json({ error: "Invalid evidence reference." }, { status: 400 });
  const { data: image, error } = await supabase.storage.from("return-evidence").download(body.evidencePath);
  if (error || !image || image.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Evidence image could not be read." }, { status: 422 });
  const fallback = { supportsClaim: "unclear", observation: "Evidence requires seller review." };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ ...fallback, source: "template" });
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 140,
      system: "Assess only visible image evidence for an e-commerce return. Do not identify people or accuse anyone of fraud. Reply with exactly two lines: SUPPORTS: yes, no, or unclear; OBSERVATION: one concise sentence.",
      messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: body.contentType, data: Buffer.from(await image.arrayBuffer()).toString("base64") } }, { type: "text", text: `Customer return reason: ${body.reason ?? "not provided"}. Does the visible image appear consistent with this claim?` }] }]
    })
  });
  if (!response.ok) return NextResponse.json({ ...fallback, source: "template" });
  const payload = await response.json() as { content?: { type: string; text?: string }[] };
  const text = payload.content?.find(block => block.type === "text")?.text ?? "";
  const supportsClaim = /SUPPORTS:\s*(yes|no|unclear)/i.exec(text)?.[1]?.toLowerCase() ?? "unclear";
  const observation = /OBSERVATION:\s*(.+)/i.exec(text)?.[1]?.trim() || fallback.observation;
  return NextResponse.json({ supportsClaim, observation, source: "claude" });
}
