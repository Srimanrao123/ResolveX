"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CaseActions({ returnId, currentStatus }: { returnId: string; currentStatus?: string }) {
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const [refundReference, setRefundReference] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function decide(decision: "approve" | "reject" | "request_info" | "mark_returning" | "mark_received" | "mark_refunded") {
    setLoading(decision);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/seller/returns/${returnId}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision, note, refundReference }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(result.error ?? "We could not save that decision.");
      } else {
        setIsError(false);
        setMessage(result.message ?? `Return ${decision.replace("_", " ")}ed successfully.`);
        router.refresh();
      }
    } catch {
      setIsError(true);
      setMessage("Unable to reach the server. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  const isReviewable = currentStatus === "Needs review" || currentStatus === "More info";
  const canMarkReturning = currentStatus === "Approved";
  const canMarkReceived = currentStatus === "Approved" || currentStatus === "Returning";
  const canMarkRefunded = currentStatus === "Received";

  return (
    <div className="case-actions-wrap">
      {isReviewable && (
        <>
          <label className="case-action-label">
            <span>Decision note <small>(required for review)</small></span>
            <textarea
              className="case-action-textarea"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Explain the policy, evidence, or information needed…"
            />
          </label>
          <div className="case-action-btn-stack">
            <button
              onClick={() => decide("approve")}
              disabled={Boolean(loading)}
              className="button primary full"
            >
              {loading === "approve" ? "Saving…" : "✓ Approve return"}
            </button>
            <button
              onClick={() => decide("reject")}
              disabled={Boolean(loading)}
              className="button danger full"
            >
              {loading === "reject" ? "Saving…" : "✕ Reject return"}
            </button>
            <button
              onClick={() => decide("request_info")}
              disabled={Boolean(loading)}
              className="button ghost full"
            >
              {loading === "request_info" ? "Saving…" : "✉ Request information"}
            </button>
          </div>
        </>
      )}

      {canMarkReturning && (
        <button
          onClick={() => decide("mark_returning")}
          disabled={Boolean(loading)}
          className="button ghost full"
        >
          {loading === "mark_returning" ? "Saving…" : "🚚 Mark item returning"}
        </button>
      )}

      {canMarkReceived && (
        <button
          onClick={() => decide("mark_received")}
          disabled={Boolean(loading)}
          className="button primary full"
        >
          {loading === "mark_received" ? "Saving…" : "📥 Mark item received"}
        </button>
      )}

      {canMarkRefunded && (
        <>
          <label className="case-action-label">
            <span>Refund reference <small>(required)</small></span>
            <input
              className="case-action-input"
              value={refundReference}
              onChange={(event) => setRefundReference(event.target.value)}
              placeholder="Provider transaction or manual reference"
            />
          </label>
          <button
            onClick={() => decide("mark_refunded")}
            disabled={Boolean(loading)}
            className="button primary full"
          >
            {loading === "mark_refunded" ? "Saving…" : "💳 Mark refund issued"}
          </button>
        </>
      )}

      {!isReviewable && !canMarkReturning && !canMarkReceived && !canMarkRefunded && (
        <div className="case-action-settled">
          <span>✓</span>
          <p>No further return action is required for this case status.</p>
        </div>
      )}

      {message && (
        <p className={`action-message ${isError ? "error" : "success"}`}>
          {isError ? "⚠️ " : "✓ "}
          {message}
        </p>
      )}
    </div>
  );
}
