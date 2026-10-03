import Link from "next/link";
import { requireCustomer } from "@/lib/route-guards";
import { getCustomerReturn } from "@/lib/customer-returns";

const views: Record<string, { title: string; label: string; body: string; tone: string; icon: string; timeline: string[] }> = {
  approved: {
    title: "Your return is approved",
    label: "APPROVED",
    tone: "good",
    icon: "✓",
    body: "Your order is eligible and your request is all set. We'll send return instructions to your email shortly.",
    timeline: ["Return requested", "Approved", "Send item back", "Refund processed"],
  },
  "more-info": {
    title: "We need one more thing",
    label: "MORE INFORMATION REQUIRED",
    tone: "warm",
    icon: "📷",
    body: "Please upload a photo showing the damaged or defective area so we can continue reviewing your return.",
    timeline: ["Return requested", "Photo needed", "Under review", "Decision"],
  },
  "not-eligible": {
    title: "This return is not eligible",
    label: "NOT ELIGIBLE",
    tone: "bad",
    icon: "×",
    body: "This item is outside the seller's eligible return policy. If you believe this is a mistake, please contact the seller.",
    timeline: ["Return requested", "Policy checked", "Not eligible", "Closed"],
  },
  review: {
    title: "Your request is under review",
    label: "SELLER REVIEW",
    tone: "warm",
    icon: "🔍",
    body: "This return needs a quick review from the seller. We'll update you as soon as a decision is made. No action needed from you right now.",
    timeline: ["Return requested", "Under review", "Decision", "Return complete"],
  },
  "RET-2048": {
    title: "Your request is under review",
    label: "SELLER REVIEW",
    tone: "warm",
    icon: "🔍",
    body: "We're reviewing the return details and will update you soon. No action is needed from you right now.",
    timeline: ["Return requested", "Under review", "Decision", "Return complete"],
  },
};

export default async function ReturnStatusPage({ params }: { params: Promise<{ id: string }> }) {
  await requireCustomer();
  const { id } = await params;
  const liveReturn = await getCustomerReturn(id);

  if (liveReturn) {
    const statusTitle: Record<string, string> = {
      APPROVED: "Your return is approved",
      MORE_INFO_REQUIRED: "We need one more thing",
      UNDER_REVIEW: "Your request is under review",
      REJECTED: "This return is not eligible",
      RETURNING: "Your return is on its way",
      RECEIVED: "Your return was received",
      REFUNDED: "Your refund is being processed",
      COMPLETED: "Your return is complete",
    };
    const customerStatusDescriptions: Record<string, string> = {
      APPROVED: "Your return is approved. We've emailed you a prepaid shipping label and packing instructions.",
      MORE_INFO_REQUIRED: "Please upload a photo of the item so we can finish reviewing your request.",
      UNDER_REVIEW: "We have received your return request. Our customer care team is reviewing it and will notify you within 24 hours.",
      REJECTED: "This purchase is outside our standard 30-day return policy window. Contact customer care if you need further help.",
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
          {liveReturn.events.map((event, index) => (
            <div className="timeline-step complete" key={`${event.status}-${index}`}>
              <div className="step-dot">✓</div>
              <p>{event.status.replaceAll("_", " ")}</p>
            </div>
          ))}
        </section>
        <Link href="/orders" className="button ghost">← Back to my orders</Link>
      </div>
    );
  }

  const view = views[id] ?? views.review;
  return (
    <div className="page-shell narrow status-page">
      <p className="eyebrow">RETURN STATUS</p>
      <div className={`result-icon ${view.tone}`}>{view.icon}</div>
      <p className={`status-label ${view.tone}`}>{view.label}</p>
      <h1>{view.title}</h1>
      <p className="lead">{view.body}</p>
      <section className="timeline">
        {view.timeline.map((step, index) => (
          <div className={index < 2 ? "timeline-step complete" : "timeline-step"} key={step}>
            <div className="step-dot">{index < 2 ? "✓" : index + 1}</div>
            <p>{step}</p>
          </div>
        ))}
      </section>
      <Link href="/orders" className="button ghost">← Back to my orders</Link>
    </div>
  );
}
