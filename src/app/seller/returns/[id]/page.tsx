import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import { CaseActions } from "@/components/case-actions";
import { AiCaseSummary } from "@/components/ai-case-summary";
import { getSellerCaseById } from "@/lib/seller-data";
import { requireSeller } from "@/lib/route-guards";

export default async function SellerCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSeller();
  const { id } = await params;
  const item = await getSellerCaseById(id);

  if (!item) {
    return (
      <div className="page-shell seller-shell">
        <Link href="/seller" className="back-link">← Return queue</Link>
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <h2>Return case not found</h2>
          <p style={{ color: "var(--muted)", marginTop: 8 }}>Case {id} does not exist in the database.</p>
        </div>
      </div>
    );
  }

  const riskColors: Record<string, { bg: string; color: string }> = {
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
                <strong>{item.evidence.toLowerCase().includes("no evidence") ? "Not Required" : "Evaluated"}</strong>
                <p>{item.evidence}</p>
              </div>
            </div>
          </section>

          {/* Customer request */}
          <section className="case-section">
            <h2>Customer request</h2>
            <p><strong>Reason:</strong> {item.reason}</p>
            {item.customerMessage ? (
              <p style={{ marginTop: 8 }}>&ldquo;{item.customerMessage}&rdquo;</p>
            ) : (
              <p style={{ marginTop: 8, color: "var(--muted)" }}>No customer message provided.</p>
            )}
            <div className="evidence-preview">
              <span>Customer evidence</span>
              {item.evidenceImageUrl ? (
                <div className="evidence-image-card">
                  <a
                    href={item.evidenceImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="evidence-image-link"
                    title="Click to open full resolution in new tab"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.evidenceImageUrl}
                      alt={`Customer evidence for ${item.id}`}
                      className="evidence-image-img"
                    />
                  </a>
                  <div className="evidence-image-meta">
                    <span>Uploaded photo evidence</span>
                    <a
                      href={item.evidenceImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open full resolution ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  📷 No photo evidence uploaded
                  <br />
                  <small style={{ color: "var(--muted-2)" }}>Customer proceeded without attaching photos</small>
                </div>
              )}
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
            <strong>{item.requestedResolution ? (item.requestedResolution.charAt(0).toUpperCase() + item.requestedResolution.slice(1)) : "Refund"}</strong>
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
            <CaseActions returnId={item.id} currentStatus={item.status} />
          </section>
        </aside>
      </div>
    </div>
  );
}
