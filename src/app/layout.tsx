import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { CartNavLink } from "@/components/cart-nav-link";
import { AuthControl } from "@/components/auth-control";
import { getCurrentProfile } from "@/lib/app-auth";

export const metadata: Metadata = {
  title: "ReturnGuard AI — Intelligent Return Operations",
  description: "AI-powered return management for small and medium e-commerce businesses. Investigate, resolve and learn from every return.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand">
                <span className="brand-mark">R</span>
                ReturnGuard <em>AI</em>
              </Link>
              <nav>
                {profile?.role === "seller" ? (
                  <>
                    <Link href="/seller">Dashboard</Link>
                    <Link href="/seller/insights">Insights</Link>
                    <AuthControl email={profile?.email} />
                  </>
                ) : profile?.role === "customer" ? (
                  <>
                    <Link href="/shop">Shop</Link>
                    <Link href="/orders">My Orders</Link>
                    <CartNavLink />
                    <AuthControl email={profile?.email} />
                  </>
                ) : (
                  <>
                    <Link href="/shop">Shop</Link>
                    <CartNavLink />
                    <Link href="/login" className="nav-cta">Sign in</Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
