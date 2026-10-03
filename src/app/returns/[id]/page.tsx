import Link from "next/link";
import { requireCustomer } from "@/lib/route-guards";
import { getCustomerReturn, getCustomerReturnForOrder } from "@/lib/customer-returns";
import { formatPrice } from "@/lib/demo-data";
import { PrintReturnLabelButton } from "@/components/return-label-button";

export default async function ReturnStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ order?: string; item?: string; resolution?: string }>;
}) {
  await requireCustomer();
  const { id } = await params;
  const search = searchParams ? await searchParams : {};
  let liveReturn = await getCustomerReturn(id);

  // Fallback 1: If not found by direct ID (e.g. from keyword redirect with order param), find via order/item
  if (!liveReturn && search?.order) {
    const existing = await getCustomerReturnForOrder(search.order, search.item);
    if (existing?.display_id) {
      liveReturn = await getCustomerReturn(existing.display_id);
    }
  }

  // 1. LIVE DATABASE RETURN FOUND
  if (liveReturn) {
    const statusTitle: Record<string, string> = {
      APPROVED: "Your return is approved",
      MORE_INFO_REQUIRED: "Additional details needed",
      UNDER_REVIEW: "Your request is under review",
      REJECTED: "This return was rejected",
      RETURNING: "Your return is on its way",
      RECEIVED: "Your return was received",
      REFUNDED: "Your refund is being processed",
      COMPLETED: "Your return is complete",
    };

    const customerStatusDescriptions: Record<string, string> = {
      APPROVED:
        "Your return request has been authorized. Pack the item securely and follow the return instructions provided by the seller.",
      MORE_INFO_REQUIRED:
        "Please provide additional photos or details of the item so our care team can complete your return review.",
      UNDER_REVIEW:
        "We have received your return request. Our care team is reviewing it against merchant policy and will notify you soon.",
      REJECTED:
        "The seller reviewed your return request and determined it is not eligible under our standard return policy.",
      RETURNING:
        "Your package is currently in transit back to our warehouse.",
      RECEIVED:
        "Your return package has arrived safely at our inspection facility.",
      REFUNDED:
        "Your refund has been recorded as issued. Check your original payment method for the provider's processing time.",
      COMPLETED:
        "Your return and resolution have been successfully completed.",
    };

    const title = statusTitle[liveReturn.status] ?? "Your return is being processed";
    const leadMessage =
      customerStatusDescriptions[liveReturn.status] ??
      "We'll keep you updated as your return progresses.";

    const tone =
      liveReturn.status === "APPROVED" ||
      liveReturn.status === "COMPLETED" ||
      liveReturn.status === "REFUNDED"
        ? "good"
        : liveReturn.status === "REJECTED"
        ? "bad"
        : "warm";

    const icons: Record<string, string> = { good: "✓", warm: "🔍", bad: "×" };

    const isApproved = liveReturn.status === "APPROVED";
    const isRejected = liveReturn.status === "REJECTED";
    const isUnderReview = liveReturn.status === "UNDER_REVIEW";

    // Progressive timeline stages
    const timelineStages = [
      { key: "requested", label: "Requested", isComplete: true, isCurrent: false },
      {
        key: "reviewed",
        label: isRejected ? "Rejected" : "Approved",
        isComplete: isApproved || isRejected || ["RETURNING", "RECEIVED", "REFUNDED", "COMPLETED"].includes(liveReturn.status),
        isCurrent: isUnderReview || liveReturn.status === "MORE_INFO_REQUIRED",
        isBad: isRejected,
      },
      {
        key: "in_transit",
        label: "Item Shipped",
        isComplete: ["RECEIVED", "REFUNDED", "COMPLETED"].includes(liveReturn.status),
        isCurrent: isApproved || liveReturn.status === "RETURNING",
      },
      {
        key: "refunded",
        label: "Refund Issued",
        isComplete: ["REFUNDED", "COMPLETED"].includes(liveReturn.status),
        isCurrent: liveReturn.status === "RECEIVED",
      },
    ];

    return (
      <div className="page-shell narrow status-page" style={{ maxWidth: 680, margin: "0 auto", paddingBottom: 60 }}>
        <p className="eyebrow">RETURN CASE · {liveReturn.display_id}</p>
        <div className={`result-icon ${tone}`}>{icons[tone]}</div>
        <p className={`status-label ${tone}`}>{liveReturn.status.replaceAll("_", " ")}</p>
        <h1>{title}</h1>
        <p className="lead">{leadMessage}</p>

        {/* Product / Case summary card */}
        <div
          className="order-card"
          style={{
            margin: "24px 0",
            textAlign: "left",
            backgroundColor: "var(--card)",
            border: "1px solid var(--line)",
          }}
        >
          <div className="product-art">
            {liveReturn.productImage ? (
              <img
                src={liveReturn.productImage}
                alt={liveReturn.productName}
                className="product-image-cover"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
              />
            ) : (
              liveReturn.productName.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="order-info">
            <p className="order-number">
              {liveReturn.orderDisplayId ? `ORDER #${liveReturn.orderDisplayId} · ` : ""}
              REF: {liveReturn.display_id}
            </p>
            <h2>{liveReturn.productName}</h2>
            <p>
              Resolution:{" "}
              <strong style={{ color: "var(--ink)" }}>
                {liveReturn.requested_resolution
                  ? liveReturn.requested_resolution.charAt(0).toUpperCase() +
                    liveReturn.requested_resolution.slice(1)
                  : "Refund"}
                {liveReturn.amount ? ` (${formatPrice(liveReturn.amount)})` : ""}
              </strong>
            </p>
          </div>
        </div>

        {/* Action / Next steps card for APPROVED */}
        {isApproved && (
          <div
            style={{
              background: "var(--surface)",
              border: "1.5px solid var(--mint-line, #c8dfd3)",
              borderRadius: "var(--radius)",
              padding: "24px",
              margin: "24px 0",
              textAlign: "left",
            }}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📦</span> Next Steps for Your Return
            </h3>
            <ol style={{ margin: "0 0 18px", paddingLeft: "20px", lineHeight: "1.7", fontSize: "14px", color: "var(--ink-2)" }}>
              <li>
                <strong>Pack your item:</strong> Place the item in its original box or secure packaging with all tags attached.
              </li>
              <li>
                <strong>Use your seller-provided shipping instructions:</strong> This app does not generate a courier label.
              </li>
              <li>
                <strong>Drop off or doorstep pickup:</strong> Hand over to any authorized courier partner.
              </li>
            </ol>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <PrintReturnLabelButton
                displayId={liveReturn.display_id}
                productName={liveReturn.productName}
                orderId={liveReturn.orderDisplayId ?? undefined}
              />
              <span style={{ fontSize: "12.5px", color: "var(--muted)" }}>Packing checklist only — shipping method is confirmed by the seller</span>
            </div>
          </div>
        )}

        {/* Multi-step progression timeline */}
        <section className="timeline" style={{ marginTop: 36, marginBottom: 24 }}>
          {timelineStages.map((stage) => {
            const isDone = stage.isComplete;
            const isCurrent = stage.isCurrent;
            const isBad = stage.isBad;
            return (
              <div
                className={`timeline-step ${isDone ? "complete" : ""}`}
                key={stage.key}
              >
                <div
                  className={`step-dot ${isBad ? "dot-bad" : ""}`}
                  style={{
                    backgroundColor: isDone
                      ? isBad
                        ? "var(--red)"
                        : "var(--moss)"
                      : isCurrent
                      ? "var(--warm-bg, #fff4e3)"
                      : "var(--card)",
                    borderColor: isDone
                      ? isBad
                        ? "var(--red)"
                        : "var(--moss)"
                      : isCurrent
                      ? "#d97706"
                      : "var(--line)",
                    color: isDone ? "#fff" : isCurrent ? "#d97706" : "var(--muted)",
                  }}
                >
                  {isDone ? (isBad ? "×" : "✓") : isCurrent ? "●" : "○"}
                </div>
                <p style={{ fontWeight: isDone || isCurrent ? 600 : 400, color: isDone || isCurrent ? "var(--ink)" : "var(--muted)" }}>
                  {stage.label}
                </p>
              </div>
            );
          })}
        </section>

        {liveReturn.sellerDecisionNote && (
          <section className="case-section" style={{ textAlign: "left" }}>
            <h2>Seller update</h2>
            <p>{liveReturn.sellerDecisionNote}</p>
          </section>
        )}

        {/* Detailed event log if any */}
        {liveReturn.events && liveReturn.events.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "var(--surface)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line)",
              textAlign: "left",
              fontSize: "13px",
            }}
          >
            <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "11px", letterSpacing: "1px", color: "var(--muted)" }}>
              ACTIVITY LOG
            </p>
            {liveReturn.events.map((evt: { status: string; message: string | null; created_at?: string }, i: number) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "6px 0",
                  borderTop: i > 0 ? "1px solid var(--line)" : "none",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{evt.status.replaceAll("_", " ")}</span>
                  {evt.message && (
                    <span style={{ color: "var(--muted)", marginLeft: "8px" }}>— {evt.message}</span>
                  )}
                </div>
                {evt.created_at && (
                  <span style={{ color: "var(--muted-2)", fontSize: "11.5px", whiteSpace: "nowrap" }}>
                    {new Date(evt.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 32, display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/orders" className="button primary">
            View My Orders
          </Link>
          <Link href="/" className="button ghost">
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  // 2. FALLBACK: KNOWN STATUS KEYWORDS (e.g. from direct URL or mock tests)
  const lowerId = id.toLowerCase();
  const keywordViews: Record<string, { tone: string; icon: string; label: string; title: string; lead: string }> = {
    approved: {
      tone: "good",
      icon: "✓",
      label: "APPROVED",
      title: "Your return is approved",
      lead: "Your return request has been authorized. A prepaid shipping label and packing instructions have been generated for you.",
    },
    review: {
      tone: "warm",
      icon: "🔍",
      label: "UNDER REVIEW",
      title: "Your request is under review",
      lead: "We have received your return request. Our care team is reviewing it against merchant policy and will notify you soon.",
    },
    "more-info": {
      tone: "warm",
      icon: "📸",
      label: "MORE INFO NEEDED",
      title: "Additional details needed",
      lead: "Please check your email or orders to upload any requested photos or documentation for this item.",
    },
    "not-eligible": {
      tone: "bad",
      icon: "×",
      label: "NOT ELIGIBLE",
      title: "Return not eligible",
      lead: "This purchase is outside our standard 30-day return window or is marked final sale.",
    },
  };

  const outcomeView = keywordViews[lowerId];

  if (outcomeView) {
    return (
      <div className="page-shell narrow status-page" style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 60 }}>
        <p className="eyebrow">RETURN STATUS</p>
        <div className={`result-icon ${outcomeView.tone}`}>{outcomeView.icon}</div>
        <p className={`status-label ${outcomeView.tone}`}>{outcomeView.label}</p>
        <h1>{outcomeView.title}</h1>
        <p className="lead">{outcomeView.lead}</p>
        <div style={{ marginTop: 32, display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href="/orders" className="button primary">
            View My Orders
          </Link>
          <Link href="/" className="button ghost">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // 3. GENUINELY NOT FOUND
  return (
    <div className="page-shell narrow status-page" style={{ maxWidth: 540, margin: "0 auto", paddingBottom: 60 }}>
      <p className="eyebrow">RETURN STATUS</p>
      <div className="result-icon warm">🔍</div>
      <p className="status-label warm">NOT FOUND</p>
      <h1>Return case not found</h1>
      <p className="lead">We could not locate return case #{id} in your account. Please verify the ID or view your orders.</p>
      <div style={{ marginTop: 32, display: "flex", gap: "12px", justifyContent: "center" }}>
        <Link href="/orders" className="button primary">
          View My Orders
        </Link>
        <Link href="/" className="button ghost">
          Back to Store
        </Link>
      </div>
    </div>
  );
}
