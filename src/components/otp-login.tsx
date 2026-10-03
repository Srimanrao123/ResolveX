"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function OtpLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch("/api/auth/send-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const result = await response.json() as { error?: string };
    setLoading(false); setSent(response.ok); setMessage(result.error ?? "Verification code sent. Check your inbox.");
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code: token }) });
    const result = await response.json() as { error?: string; role?: "seller" | "customer" };
    setLoading(false); if (!response.ok) { setMessage(result.error ?? "Unable to verify the code."); return; } router.push(result.role === "seller" ? "/seller" : "/"); router.refresh();
  }

  return !sent ? <form className="auth-form" onSubmit={sendCode}><label><span>Email address</span><input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@company.com" /></label><button disabled={loading} className="button primary full">{loading ? "Sending…" : "Send verification code"}</button>{message && <p className="form-message">{message}</p>}</form> : <form className="auth-form" onSubmit={verifyCode}><label><span>6-digit code sent to {email}</span><input required inputMode="numeric" maxLength={6} value={token} onChange={event => setToken(event.target.value)} placeholder="000000" /></label><button disabled={loading} className="button primary full">{loading ? "Verifying…" : "Verify and sign in"}</button><button type="button" onClick={() => setSent(false)} className="text-button">Use a different email</button>{message && <p className="form-message">{message}</p>}</form>;
}
