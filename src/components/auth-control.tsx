"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AuthControl({ email }: { email?: string }) { const router = useRouter(); if (!email) return <Link href="/login" className="nav-cta">Sign in</Link>; return <button className="nav-cta" onClick={async () => { await fetch("/api/auth/sign-out", { method: "POST" }); router.push("/login"); router.refresh(); }}>Sign out</button>; }
