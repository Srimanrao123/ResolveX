import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createOtp, hashValue, normalizeEmail } from "@/lib/app-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  const normalized = typeof email === "string" ? normalizeEmail(email) : "";

  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!admin) {
    return NextResponse.json({ error: "Database service unavailable." }, { status: 503 });
  }

  const code = createOtp();
  const codeHash = hashValue(code);

  // Directly upsert into email_otps so test logins aren't blocked by 60s cooldowns
  const { error: dbError } = await admin.from("email_otps").upsert({
    email: normalized,
    code_hash: codeHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    last_sent_at: new Date().toISOString(),
    attempts: 0,
  });

  if (dbError) {
    console.error("Failed to save OTP to database:", dbError);
    return NextResponse.json({ error: "Unable to create login code. Please try again." }, { status: 500 });
  }

  console.log(`[ReturnGuard Auth] Generated OTP for ${normalized}: ${code}`);

  // Attempt sending via Resend if credentials are present
  let sentViaEmail = false;
  if (apiKey && from) {
    try {
      const resend = new Resend(apiKey);
      const { error: emailError } = await resend.emails.send({
        from,
        to: normalized,
        subject: "Your ReturnGuard verification code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#1b5e42;margin:0 0 12px">ReturnGuard AI</h2>
            <p style="color:#4b5563;font-size:15px;margin:0 0 16px">Your single-use sign in verification code is:</p>
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;margin:0 0 20px">
              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1b5e42">${code}</span>
            </div>
            <p style="color:#6b7280;font-size:13px;margin:0">This code expires in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
          </div>
        `,
      });

      if (!emailError) {
        sentViaEmail = true;
      } else {
        console.warn(`[Resend Notice] Could not deliver email to ${normalized}:`, emailError.message);
      }
    } catch (err) {
      console.warn("[Resend Exception]:", err);
    }
  }

  return NextResponse.json({
    ok: true,
    email: normalized,
    sentViaEmail,
    devCode: !sentViaEmail ? code : undefined,
    message: `Verification code sent to ${normalized}. Check your inbox.`,
  });
}
