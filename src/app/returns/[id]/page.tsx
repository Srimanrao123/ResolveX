import Link from "next/link";
import { requireCustomer } from "@/lib/route-guards";
import { getCustomerReturn } from "@/lib/customer-returns";

export default async function ReturnStatusPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCustomer();
  const { id } = await params;
  const liveReturn = await getCustomerReturn(id);

  if (liveReturn) {
    const statusTitle: Record<string, string> = {
      APPROVED: "Your return is approved",
      MORE_INFO_REQUIRED: "We need one more thing",
      UNDER_REVIEW: "Your request is under review",
      REJECTED: "This return was rejected",
      RETURNING: "Your return is on its way",
      RECEIVED: "Your return was received",
      REFUNDED: "Your refund is being processed",
      COMPLETED: "Your return is complete",
    };
    const customerStatusDescriptions: Record<string, string> = {
      APPROVED: "Your return is approved. We've emailed you a prepaid shipping label and packing instructions.",
      MORE_INFO_REQUIRED: "Please upload a photo of the item so we can finish reviewing your request.",
      UNDER_REVIEW: "We have received your return request. Our care team is reviewing it and will notify you soon.",
      REJECTED: "The seller reviewed your return request and marked it as not eligible for a return or refund.",
      RETURNING: "Your package is currently in transit back to our warehouse.",
      RECEIVED: "Your return package has arrived safely at our facility.",
      REFUNDED: "Your refund has been issued to your original payment method.",
      COMPLETED: "Your return and resolution have been completed.",
    };
    const title = statusTitle[liveReturn.status] ?? "Your return is being processed";
    const leadMessage = customerStatusDescriptions[liveReturn.status] ?? "We'll keep you updated as your return progresses.";
    const tone = liveReturn.status === "APPROVED" || liveReturn.status === "COMPLETED" || liveReturn.status === "REFUNDED"
      ? "good"
      : liveReturn.status === "REJECTED"
      ? "bad"
      : "warm";
    const icons: Record<string, string> = { good: "✓", warm: "🔍", bad: "×" };

    return (
      <div className="page-shell narrow status-page">
        <p className="eyebrow">RETURN {liveReturn.display_id}</p>
        <div className={`result-icon ${tone}`}>{icons[tone]}</div>
        <p className={`status-label ${tone}`}>{liveReturn.status.replaceAll("_", " ")}</p>
        <h1>{title}</h1>
        <p className="lead">{leadMessage}</p>

        <section className="timeline">
          {liveReturn.events && liveReturn.events.length > 0 ? (
            liveReturn.events.map((event: { status: string; message: string | null }, index: number) => (
              <div
                className={`timeline-step complete ${event.status === "REJECTED" ? "rejected-step" : ""}`}
                key={`${event.status}-${index}`}
              >
                <div className={`step-dot ${event.status === "REJECTED" ? "dot-bad" : ""}`}>
                  {event.status === "REJECTED" ? "×" : "✓"}
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>{event.status.replaceAll("_", " ")}</p>
                  {event.message && (
                    <small style={{ color: "var(--muted)", display: "block", marginTop: 2 }}>
                      {event.message}
                    </small>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="timeline-step complete">
              <div className="step-dot">✓</div>
              <div>
                <p style={{ fontWeight: 600 }}>{liveReturn.status.replaceAll("_", " ")}</p>
              </div>
            </div>
          )}
        </section>

        <div style={{ marginTop: 24 }}>
          <Link href="/orders" className="button ghost">← Back to my orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell narrow status-page">
      <p className="eyebrow">RETURN STATUS</p>
      <div className="result-icon warm">🔍</div>
      <p className="status-label warm">NOT FOUND</p>
      <h1>Return case not found</h1>
      <p className="lead">We could not locate this return case in your account.</p>
      <div style={{ marginTop: 24 }}>
        <Link href="/orders" className="button ghost">← Back to my orders</Link>
      </div>
    </div>
  );
}
