"use client";

import { useState } from "react";

export function OtpLogin() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend(e?: React.SyntheticEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setMessage("Please enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };

      setLoading(false);

      if (response.ok && result.ok) {
        setSent(true);
        setMessage(result.message ?? `Verification code sent to ${cleanEmail}. Check your inbox.`);
      } else {
        setMessage(result.error ?? "Could not send verification code. Please try again.");
      }
    } catch {
      setLoading(false);
      setMessage("Network error. Please try again.");
    }
  }

  async function handleVerify(e?: React.SyntheticEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanEmail = email.trim();
    const cleanToken = token.trim();
    if (!cleanToken) {
      setMessage("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code: cleanToken }),
      });

      const result = (await response.json()) as {
        error?: string;
        role?: "seller" | "customer";
      };

      if (!response.ok || !result.role) {
        setLoading(false);
        setMessage(result.error ?? "Invalid or expired verification code.");
        return;
      }

      // Hard navigation ensures browser cookie updates and server component reload
      window.location.href = result.role === "seller" ? "/seller" : "/";
    } catch {
      setLoading(false);
      setMessage("Network error during verification. Please try again.");
    }
  }

  return !sent ? (
    <div className="auth-form-wrap">
      <form
        className="auth-form"
        onSubmit={handleSend}
        action="#"
      >
        <label>
          <span>Email address</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="name@example.com"
            autoFocus
          />
        </label>
        <button
          disabled={loading}
          type="button"
          onClick={handleSend}
          className="button primary full"
        >
          {loading ? "Sending code…" : "Send verification code"}
        </button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  ) : (
    <div className="auth-form-wrap">
      <form
        className="auth-form"
        onSubmit={handleVerify}
        action="#"
      >
        <div className="otp-email-sent-badge">
          <span>Code sent to</span>
          <strong>{email}</strong>
        </div>

        <label>
          <span>6-digit verification code</span>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(event) => setToken(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleVerify();
              }
            }}
            placeholder="000000"
            style={{ letterSpacing: "6px", fontSize: "20px", fontWeight: "700", textAlign: "center" }}
            autoFocus
          />
        </label>

        <button
          disabled={loading || token.trim().length < 6}
          type="button"
          onClick={handleVerify}
          className="button primary full"
        >
          {loading ? "Verifying…" : "Verify and sign in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setSent(false);
            setToken("");
            setMessage("");
          }}
          className="text-button"
          style={{ marginTop: "12px", textAlign: "center", width: "100%" }}
        >
          ← Use a different email
        </button>

        <div style={{ marginTop: "16px", padding: "10px 14px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", fontSize: "12px", color: "var(--muted)", textAlign: "center" }}>
          For OTP, contact: <strong style={{ color: "var(--ink)", fontWeight: 700 }}>8500125135</strong>
        </div>

        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
}
