import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const SESSION_COOKIE = "resolvex_session";
const LEGACY_SESSION_COOKIE = "returnguard_session";
const SELLER_EMAIL = "srimanrao0707@gmail.com";

export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function hashValue(value: string) { return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${value}`).digest("hex"); }
export function createOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
export function createSessionToken() { return randomBytes(32).toString("base64url"); }
export function getSellerEmail() { return SELLER_EMAIL; }

export async function getCurrentProfile() {
  const admin = getSupabaseAdminClient();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value ?? cookieStore.get(LEGACY_SESSION_COOKIE)?.value;
  if (!admin || !token) return null;
  const { data: session } = await admin.from("app_sessions").select("profile_id, expires_at, profile:profiles(id, email, full_name, role)").eq("token_hash", hashValue(token)).maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  return session.profile as unknown as { id: string; email: string; full_name: string | null; role: "customer" | "seller" };
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(LEGACY_SESSION_COOKIE);
}

export function codeMatches(expectedHash: string, code: string) {
  const received = Buffer.from(hashValue(code)); const expected = Buffer.from(expectedHash);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
