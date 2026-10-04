import Link from "next/link";
import { ResolveXLogo } from "@/components/resolve-x-logo";

export function StoreFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div className="footer-brand-col">
            <Link href="/" className="brand" aria-label="ResolveX Home">
              <ResolveXLogo size="md" />
            </Link>
            <p className="footer-desc">
              Thoughtfully tailored daily essentials built with responsible textiles and protected by ResolveX intelligent returns.
            </p>
            <div className="footer-trust-badge">
              <span className="trust-badge-dot">●</span>
              <span>14-Day Automated Returns Guarantee</span>
            </div>
          </div>

          {/* Collection Links */}
          <div className="footer-nav-col">
            <p className="footer-col-title">Collection</p>
            <ul>
              <li><Link href="/shop">All Essentials</Link></li>
              <li><Link href="/shop">Trending Pieces</Link></li>
              <li><Link href="/shop">Organic Cotton</Link></li>
              <li><Link href="/shop">Structured Jackets</Link></li>
              <li><Link href="/shop">Footwear &amp; Runners</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="footer-nav-col">
            <p className="footer-col-title">Customer Care</p>
            <ul>
              <li><Link href="/orders">Track Orders</Link></li>
              <li><Link href="/orders">Initiate Return or Exchange</Link></li>
              <li><Link href="/cart">Shopping Bag</Link></li>
              <li><Link href="/login">Account Sign In</Link></li>
              <li><Link href="/shop">Size &amp; Fit Guide</Link></li>
            </ul>
          </div>

          {/* Trust & Guarantees */}
          <div className="footer-nav-col">
            <p className="footer-col-title">ResolveX Promise</p>
            <ul className="footer-perks-list">
              <li>
                <span className="perk-bullet">⚡</span>
                <div>
                  <strong>Instant Return Approvals</strong>
                  <p>Automated policy verification</p>
                </div>
              </li>
              <li>
                <span className="perk-bullet">🚚</span>
                <div>
                  <strong>Complimentary Shipping</strong>
                  <p>On domestic orders over ₹1,999</p>
                </div>
              </li>
              <li>
                <span className="perk-bullet">🔒</span>
                <div>
                  <strong>Protected Payments</strong>
                  <p>End-to-end encrypted checkout</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ResolveX. All rights reserved. Crafted for effortless daily wear.</p>
          <div className="footer-bottom-links">
            <span>Encrypted Checkout</span>
            <span>·</span>
            <span>Carbon-Neutral Transit</span>
            <span>·</span>
            <span>Hassle-Free Returns</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
