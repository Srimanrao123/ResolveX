import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import { products } from "@/lib/products";
import type { DemoOrder } from "@/lib/types";
import type { CustomerReturnCaseItem } from "@/lib/customer-returns";

type CustomerHomeProps = {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    role: "customer" | "seller";
  };
  orders: DemoOrder[];
  isDemo: boolean;
  returnCases: CustomerReturnCaseItem[];
};

export function CustomerHome({ profile, orders, isDemo, returnCases }: CustomerHomeProps) {
  const displayName = profile.full_name || profile.email.split("@")[0];
  const recentOrders = orders.slice(0, 3);
  const featuredProducts = products.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <span className="status delivered">✓ Refund Approved</span>;
      case "ESCALATED_TO_SELLER":
        return <span className="status processing">⏳ Under Seller Review</span>;
      case "REJECTED":
        return <span className="status rejected">✕ Request Declined</span>;
      default:
        return <span className="status processing">{status.replace(/_/g, " ")}</span>;
    }
  };

  return (
    <div className="page-shell customer-home">
      {/* ─── Top Welcome & Navigation Header ──────────────────────── */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER PORTAL · RESOLVEX</p>
          <h1>Welcome back, {displayName} 👋</h1>
          <p>Manage your purchases, request automated returns, or explore our new collection.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {isDemo && <span className="demo-pill">Demo Mode Active</span>}
          <Link href="/shop" className="button primary">
            Browse Shop →
          </Link>
          <Link href="/cart" className="button ghost">
            View Cart
          </Link>
        </div>
      </div>

      {/* ─── AI Return Concierge Hero Banner ───────────────────────── */}
      <div className="concierge-card">
        <div className="concierge-content">
          <span className="concierge-tag">⚡ Powered by ResolveX</span>
          <h2>Need to return or exchange an item?</h2>
          <p>
            No paperwork or endless wait times. Our AI agent inspects your order date, verifies policy eligibility, and can approve routine returns in under 30 seconds.
          </p>
          <div className="concierge-actions">
            <Link href="/orders" className="button primary">
              Order Help &amp; Returns →
            </Link>
            <Link href="/orders" className="button ghost">
              View All Orders ({orders.length})
            </Link>
          </div>
        </div>
        <div className="concierge-perks">
          <div className="perk-item">
            <span className="perk-icon">⏱️</span>
            <div>
              <strong>Instant Resolution</strong>
              <p>Automated policy check and instant approval for eligible items.</p>
            </div>
          </div>
          <div className="perk-item">
            <span className="perk-icon">📦</span>
            <div>
              <strong>Prepaid Return Labels</strong>
              <p>Generated instantly when your return is approved.</p>
            </div>
          </div>
          <div className="perk-item">
            <span className="perk-icon">💬</span>
            <div>
              <strong>Conversational Flow</strong>
              <p>Friendly chat assistant explains each decision step clearly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Metric Overview Cards ─────────────────────────────────── */}
      <div className="customer-stats-grid">
        <div className="c-stat-card">
          <span className="c-stat-label">Delivered Orders</span>
          <strong className="c-stat-value">{orders.length}</strong>
          <span className="c-stat-sub">Available for returns or exchanges</span>
        </div>
        <div className="c-stat-card">
          <span className="c-stat-label">Active Return Requests</span>
          <strong className="c-stat-value">{returnCases.length}</strong>
          <span className="c-stat-sub">
            {returnCases.length > 0 ? "Tracked in real time" : "No open return disputes"}
          </span>
        </div>
        <div className="c-stat-card">
          <span className="c-stat-label">Store Guarantee</span>
          <strong className="c-stat-value">14 Days</strong>
          <span className="c-stat-sub">Hassle-free returns on unworn items</span>
        </div>
      </div>

      {/* ─── Active Return Cases (If customer has return requests) ──── */}
      {returnCases.length > 0 && (
        <section className="customer-section">
          <div className="customer-section-header">
            <div>
              <p className="eyebrow">INVESTIGATIONS &amp; RESOLUTIONS</p>
              <h2>Your Return Requests</h2>
            </div>
          </div>
          <div className="return-case-list">
            {returnCases.map((rc) => (
              <article className="return-case-summary-card" key={rc.id}>
                <div className="case-art">📦</div>
                <div className="case-summary-info">
                  <div className="case-top-row">
                    <span className="case-id">CASE #{rc.displayId}</span>
                    {getStatusBadge(rc.status)}
                  </div>
                  <h3>{rc.productName}</h3>
                  <p className="case-date">
                    Requested on{" "}
                    {new Date(rc.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="case-action">
                  <Link href={`/returns/${rc.displayId}`} className="button ghost">
                    Track status →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ─── Recent Orders ────────────────────────────────────────── */}
      <section className="customer-section">
        <div className="customer-section-header">
          <div>
            <p className="eyebrow">YOUR RECENT PURCHASES</p>
            <h2>Recent Orders</h2>
          </div>
          <Link href="/orders" className="text-link">
            View all orders ({orders.length}) →
          </Link>
        </div>

        <div className="order-list">
          {recentOrders.map((order) => (
            <article className="order-card" key={order.orderItemId ?? order.id}>
              <div className="product-art">{order.image}</div>
              <div className="order-info">
                <p className="order-number">ORDER #{order.id}</p>
                <h2>{order.product}</h2>
                <p>
                  Delivered{" "}
                  {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="order-action">
                <strong>{formatPrice(order.price)}</strong>
                <details className="help-details">
                  <summary className="help-summary-btn">
                    <span>Help</span>
                    <span className="help-caret">▾</span>
                  </summary>
                  <div className="help-menu-content">
                    <Link
                      className="help-menu-item"
                      href={`/returns/new?order=${order.id}${order.orderItemId ? `&item=${order.orderItemId}` : ""}`}
                    >
                      <strong>I want to return or exchange →</strong>
                      <small>14-day hassle-free resolution</small>
                    </Link>
                  </div>
                </details>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Featured Products / Quick Re-Order ────────────────────── */}
      <section className="customer-section">
        <div className="customer-section-header">
          <div>
            <p className="eyebrow">RESOLVEX COLLECTION</p>
            <h2>Trending Essentials</h2>
          </div>
          <Link href="/shop" className="text-link">
            Browse full catalog →
          </Link>
        </div>

        <div className="product-grid">
          {featuredProducts.map((product) => (
            <Link className="product-card" href={`/shop/${product.id}`} key={product.id}>
              <div className="store-art">
                {product.badge && <span className="badge">{product.badge}</span>}
                {product.image}
              </div>
              <p className="cat-label">{product.category}</p>
              <h2>{product.name}</h2>
              <strong>{formatPrice(product.price)}</strong>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
