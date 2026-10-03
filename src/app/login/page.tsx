import { OtpLogin } from "@/components/otp-login";

export default function LoginPage() {
  return <div className="auth-page"><div className="auth-card"><p className="eyebrow">WELCOME TO RETURNGUARD</p><h1>Sign in with your email</h1><p>We’ll send a secure 6-digit verification code. No password needed.</p><OtpLogin /><p className="auth-note">ReturnGuard sends verification codes directly through Resend. The seller portal is restricted to the approved seller email.</p></div></div>;
}
