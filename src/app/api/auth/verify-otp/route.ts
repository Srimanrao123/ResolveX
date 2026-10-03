import { NextResponse } from "next/server";
import { createSessionToken, getSellerEmail, hashValue, normalizeEmail, setSessionCookie } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email, code } = await request.json().catch(() => ({})) as { email?: string; code?: string };
  const normalized = typeof email === "string" ? normalizeEmail(email) : "";
  if (!/^\S+@\S+\.\S+$/.test(normalized) || !/^\d{6}$/.test(code ?? "")) return NextResponse.json({ error: "Enter the email and 6-digit code." }, { status: 400 });
  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "Email login is not configured yet." }, { status: 503 });
  const token = createSessionToken();
  const { data, error } = await admin.rpc("verify_returnguard_otp", { p_email: normalized, p_code_hash: hashValue(code!), p_session_hash: hashValue(token), p_seller_email: getSellerEmail() });
  if (error || !data?.[0]) return NextResponse.json({ error: "That code is invalid or expired." }, { status: 401 });
  await setSessionCookie(token);
  return NextResponse.json({ role: data[0].role, email: normalized });
}
