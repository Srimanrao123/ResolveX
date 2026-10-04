import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import { getDashboardMetrics, getSellerCases } from "@/lib/seller-data";
import { requireSeller } from "@/lib/route-guards";
import { SellerQueueTable } from "@/components/seller-queue-table";

export default async function SellerDashboard() {
  await requireSeller();
  const { cases, isDemo } = await getSellerCases();
  const metrics = getDashboardMetrics(cases);

  return (
    <div className="page-shell seller-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SELLER PORTAL</p>
          <h1>ResolveX Dashboard</h1>
          <p>Here&apos;s what your return operation needs today.</p>
        </div>
        <div>
          <Link href="/seller/orders" className="button primary">Manage Orders →</Link>
        </div>
      </div>

      <section className="stat-grid">
        <article>
          <p>Return cases</p>
          <strong>{metrics.total}</strong>
          <small>{isDemo ? "+12% from last month" : "All visible cases"}</small>
        </article>
        <article>
          <p>Auto-resolved</p>
          <strong>{metrics.approvedPercent}%</strong>
          <small>{cases.filter(i => i.status === "Approved").length} approved automatically</small>
        </article>
        <article>
          <p>Awaiting review</p>
          <strong>{metrics.review}</strong>
          <small className="alert-text">{metrics.highRisk} high-risk cases</small>
        </article>
        <article>
          <p>Avg. resolution</p>
          <strong>{isDemo ? "8 min" : "—"}</strong>
          <small>{isDemo ? "↓ Down from 14 min" : "Available after history accumulates"}</small>
        </article>
      </section>

      <Link href="/seller/insights" className="insight-card">
        <div className="insight-card-body">
          <div className="insight-pill-row">
            <span className="insight-label">✦ RESOLVEX RETURN SIGNAL</span>
            <span className="insight-action-tag">View Analysis →</span>
          </div>
          <h2>Oversized Cotton T-Shirt has a sizing signal.</h2>
          <p>
            34% of returns mention the fit is too small. Reviewing the size chart and
            product measurements could reduce future returns.
          </p>
        </div>
        <div className="insight-metric-wrap">
          <span className="insight-number">34%</span>
          <span className="insight-metric-label">Size-related returns</span>
        </div>
      </Link>

      <SellerQueueTable cases={cases} />
    </div>
  );
}
