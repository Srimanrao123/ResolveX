import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createOtp, hashValue, normalizeEmail } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({})) as { email?: string };
  const normalized = typeof email === "string" ? normalizeEmail(email) : "";
  if (!/^\S+@\S+\.\S+$/.test(normalized)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const admin = getSupabaseAdminClient();
  const apiKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
  if (!admin || !apiKey || !from) return NextResponse.json({ error: "Email login is not configured yet." }, { status: 503 });
  const code = createOtp();
  const { error: otpError } = await admin.rpc("request_returnguard_otp", { p_email: normalized, p_code_hash: hashValue(code) });
  if (otpError) return NextResponse.json({ error: otpError.message.includes("wait") ? "Please wait a minute before requesting another code." : "We could not create a login code." }, { status: 429 });
  const resend = new Resend(apiKey);
  const { error: emailError } = await resend.emails.send({ from, to: normalized, subject: "Your ReturnGuard verification code", html: `<div style="font-family:Arial,sans-serif"><h2>ReturnGuard AI</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. Do not share it with anyone.</p></div>` });
  if (emailError) return NextResponse.json({ error: "We could not send the email. Check your Resend sender configuration." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
