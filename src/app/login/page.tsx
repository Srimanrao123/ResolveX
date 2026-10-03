import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/app-auth";
import { OtpLogin } from "@/components/otp-login";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) {
    redirect(profile.role === "seller" ? "/seller" : "/");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">THREAD &amp; HUE</p>
        <h1>Sign in</h1>
        <p>Enter your email to receive a 6-digit verification code.</p>
        <OtpLogin />
      </div>
    </div>
  );
}
