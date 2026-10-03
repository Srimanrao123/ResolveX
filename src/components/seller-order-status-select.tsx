"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  initialStatus: string;
};

export function SellerOrderStatusSelect({ orderId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();

  async function handleStatusChange(nextStatus: string) {
    if (nextStatus === status || loading) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFeedback(data.error ?? "Failed to update");
      } else {
        setStatus(nextStatus);
        setFeedback("Updated ✓");
        setTimeout(() => setFeedback(null), 2500);
        router.refresh();
      }
    } catch {
      setFeedback("Network error");
    } finally {
      setLoading(false);
    }
  }

  const badgeColor =
    status === "DELIVERED"
      ? "status-delivered"
      : status === "SHIPPED"
      ? "status-shipped"
      : status === "PROCESSING"
      ? "status-processing"
      : "status-ordered";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={loading}
          className={`seller-status-select ${badgeColor}`}
          aria-label={`Change order status for ${orderId}`}
        >
          <option value="ORDERED">Ordered</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {loading && <span style={{ fontSize: 11, color: "var(--muted)" }}>Saving…</span>}
      </div>
      {feedback && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: feedback.includes("✓") ? "var(--moss)" : "var(--rust)",
          }}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
