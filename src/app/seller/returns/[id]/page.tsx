import Link from "next/link";
import { formatPrice, reviewCases } from "@/lib/demo-data";
import { CaseActions } from "@/components/case-actions";
import { AiCaseSummary } from "@/components/ai-case-summary";
import { getSellerCases } from "@/lib/seller-data";
import { requireSeller } from "@/lib/route-guards";

export default async function SellerCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const { cases } = await getSellerCases();
  const item = cases.find((v) => v.id === id) ?? reviewCases[0];

  const riskColors = {
    HIGH: { bg: "#fce8e6", color: "#c0392b" },
    MEDIUM: { bg: "#fff4e3", color: "#9a6000" },
    LOW: { bg: "#d8f4e6", color: "#1b5e42" },
  };
  const rc = riskColors[item.risk] ?? riskColors.LOW;

  return (
    <div className="page-shell seller-shell">
      <Link href="/seller" className="back-link">← Return queue</Link>

      <div className="case-title">
        <div>
          <p className="eyebrow">RETURN CASE · {item.id}</p>
          <h1>{item.product}</h1>
          <p>{item.customer} · Order #{item.orderId}</p>
        </div>
        <span
          className={`risk ${item.risk.toLowerCase()}`}
          style={{ fontSize: 12, padding: "6px 14px" }}
        >
          {item.risk} RISK
        </span>
      </div>

      <div className="case-layout">
        <div className="case-main">
          {/* AI Recommendation */}
          <section className="case-section">
            <h2>AI recommendation</h2>
            <div className="recommendation">
              <strong>Seller review recommended</strong>
              <p>{item.recommendation}</p>
            </div>
          </section>

          {/* AI Case Summary */}
          <AiCaseSummary
            product={item.product}
            reason={item.reason}
            policyResult={item.policy}
            riskSignals={item.history.split(" · ")}
            evidenceAssessment={item.evidence}
            recommendation={item.recommendation}
          />

          {/* Investigation details */}
          <section className="case-section">
            <h2>Investigation</h2>
            <div className="facts">
              <div>
                <span>Policy check</span>
                <strong className="good-text">{item.policy}</strong>
                <p>Within the 30-day return window</p>
              </div>
              <div>
                <span>Customer history</span>
                <strong>{item.history.split(" · ")[0]}</strong>
                <p>{item.history.split(" · ")[1] ?? ""}</p>
              </div>
              <div>
                <span>Evidence assessment</span>
                <strong>Inconclusive</strong>
                <p>{item.evidence}</p>
              </div>
            </div>
          </section>

          {/* Customer request */}
          <section className="case-section">
            <h2>Customer request</h2>
            <p><strong>Reason:</strong> {item.reason}</p>
            <p style={{ marginTop: 8 }}>&ldquo;The product arrived in poor condition. I would like a refund.&rdquo;</p>
            <div className="evidence-preview">
              <span>Customer evidence</span>
              <div className="image-placeholder">
                📷 Uploaded photo
                <br />
                <small style={{ color: "var(--muted-2)" }}>Image review via Claude Vision</small>
              </div>
            </div>
          </section>
        </div>

        <aside className="case-sidebar">
          <section>
            <span>Order value</span>
            <strong>{formatPrice(item.amount)}</strong>
          </section>
          <section>
            <span>Requested resolution</span>
            <strong>Refund</strong>
          </section>
          <section>
            <span>Return status</span>
            <strong>{item.status}</strong>
          </section>
          <section>
            <span>Risk level</span>
            <strong style={{ color: rc.color }}>{item.risk}</strong>
          </section>
          <section style={{ borderBottom: 0 }}>
            <CaseActions returnId={item.id} />
          </section>
        </aside>
      </div>
    </div>
  );
}
