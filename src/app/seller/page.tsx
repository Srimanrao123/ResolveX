import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import { getDashboardMetrics, getSellerCases } from "@/lib/seller-data";
import { requireSeller } from "@/lib/route-guards";

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
        {isDemo
          ? <span className="demo-pill">Demo data</span>
          : <Link href="/orders" className="button ghost">Customer portal</Link>
        }
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
        <div>
          <span className="insight-label">RESOLVEX INSIGHT</span>
          <h2>Oversized Cotton T-Shirt has a sizing signal.</h2>
          <p>
            34% of returns mention the fit is too small. Reviewing the size chart and
            product measurements could reduce future returns.
          </p>
        </div>
        <span className="insight-number">34%</span>
      </Link>

      <section className="queue-section">
        <div className="section-header">
          <div>
            <h2>Return queue</h2>
            <p>Cases needing attention are surfaced first.</p>
          </div>
          <div className="filter-pills">
            <button className="active">All</button>
            <button>Needs review</button>
            <button>High risk</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Return</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Risk</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px 16px", color: "var(--muted)" }}>
                    No return cases yet. Returns submitted by customers will appear here in real time.
                  </td>
                </tr>
              ) : (
                cases.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.id}</strong>
                      <span>{item.product} · {formatPrice(item.amount)}</span>
                    </td>
                    <td>{item.customer}</td>
                    <td>{item.reason}</td>
                    <td>
                      <span className={`risk ${item.risk.toLowerCase()}`}>{item.risk}</span>
                    </td>
                    <td>{item.status}</td>
                    <td>
                      <Link className="text-link" href={`/seller/returns/${item.id}`}>
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
