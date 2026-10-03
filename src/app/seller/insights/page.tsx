import Link from "next/link";
import { getSellerCases } from "@/lib/seller-data";
import { requireSeller } from "@/lib/route-guards";

const pretty = (value: string) =>
  value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

export default async function SellerInsightsPage() {
  await requireSeller();
  const { cases, isDemo } = await getSellerCases();

  const reasons = Object.entries(
    cases.reduce<Record<string, number>>((all, item) => {
      all[item.reason] = (all[item.reason] ?? 0) + 1;
      return all;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const products = Object.entries(
    cases.reduce<Record<string, number>>((all, item) => {
      all[item.product] = (all[item.product] ?? 0) + 1;
      return all;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const topReason = reasons[0]?.[0] ?? "No return reason";
  const topProduct = products[0]?.[0] ?? "No product";
  const max = Math.max(...reasons.map(([, count]) => count), 1);

  return (
    <div className="page-shell seller-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RETURN INTELLIGENCE</p>
          <h1>What your returns are teaching you.</h1>
          <p>Find the product, sizing, and quality signals behind every return.</p>
        </div>
        <Link href="/seller" className="button ghost">← Dashboard</Link>
      </div>

      {isDemo && <span className="demo-pill" style={{ display: "inline-block", marginBottom: 24 }}>Showing demo insight data</span>}

      <section className="digest-card">
        <p className="eyebrow">WEEKLY AI DIGEST</p>
        <h2>{cases.length} returns in focus. Top reason: {topReason}.</h2>
        <p>
          {topProduct} is the leading return driver in this view. Use the return reasons below
          to decide whether the issue is sizing, product quality, packaging, or the listing itself.
        </p>
        <div className="digest-points">
          <span>Auto-resolved routine cases</span>
          <span>Escalated cases stay seller-controlled</span>
          <span>Recommendations use structured return reasons</span>
        </div>
      </section>

      <div className="insights-grid" style={{ marginBottom: 20 }}>
        <section className="insight-panel">
          <h2>Return reasons</h2>
          <p>Most common reason across visible cases.</p>
          <div className="bar-list">
            {reasons.map(([reason, count]) => (
              <div key={reason}>
                <div className="bar-title">
                  <span>{pretty(reason)}</span>
                  <strong>{count}</strong>
                </div>
                <div className="bar-track">
                  <span style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="insight-panel">
          <h2>Products to watch</h2>
          <p>Products with the highest return volume.</p>
          <ol className="watch-list">
            {products.map(([product, count], index) => (
              <li key={product}>
                <span className="list-num">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{product}</strong>
                  <p>{count} return {count === 1 ? "case" : "cases"}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="recommendation-grid">
        <article>
          <span className="rec-tag">SIZE SIGNAL</span>
          <h2>Review sizing clarity</h2>
          <p>When size-related returns rise for a product, review the fit notes, measurements, and size chart before changing the product itself.</p>
        </article>
        <article>
          <span className="rec-tag">QUALITY SIGNAL</span>
          <h2>Investigate repeated defects</h2>
          <p>Clustered damage or defect claims should be reviewed by SKU, supplier, packaging, and delivery route.</p>
        </article>
        <article>
          <span className="rec-tag">LISTING SIGNAL</span>
          <h2>Reduce expectation gaps</h2>
          <p>"Not as expected" claims often point to product imagery, color representation, and description details.</p>
        </article>
      </div>
    </div>
  );
}
