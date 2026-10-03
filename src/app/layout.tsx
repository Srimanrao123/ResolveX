import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { CartNavLink } from "@/components/cart-nav-link";
import { ResolveXLogo } from "@/components/resolve-x-logo";
import { AuthControl } from "@/components/auth-control";
import { getCurrentProfile } from "@/lib/app-auth";

export const metadata: Metadata = {
  title: "ResolveX — Intelligent Return Operations",
  description: "AI-powered return management for modern e-commerce. Investigate, resolve, and protect your store with ResolveX.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>
        <CartProvider>
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand" aria-label="ResolveX Home">
                <ResolveXLogo size="md" />
              </Link>
              <nav>
                {profile?.role === "seller" ? (
                  <>
                    <Link href="/seller">Dashboard</Link>
                    <Link href="/seller/orders">Orders</Link>
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
