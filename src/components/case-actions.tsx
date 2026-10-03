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
    <>
      {isReviewable && <>
        <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          Decision note <span style={{ fontWeight: 400, color: "var(--muted)" }}>(required)</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Explain the policy, evidence, or information needed…" />
        </label>
        <button onClick={() => decide("approve")} disabled={Boolean(loading)} className="button primary full">
          {loading === "approve" ? "Saving…" : "Approve return"}
        </button>
        <button onClick={() => decide("reject")} disabled={Boolean(loading)} className="button danger full">
          {loading === "reject" ? "Saving…" : "Reject return"}
        </button>
        <button onClick={() => decide("request_info")} disabled={Boolean(loading)} className="button ghost full">
          {loading === "request_info" ? "Saving…" : "Request information"}
        </button>
      </>}
      {canMarkReturning && <button onClick={() => decide("mark_returning")} disabled={Boolean(loading)} className="button ghost full">Mark item returning</button>}
      {canMarkReceived && <button onClick={() => decide("mark_received")} disabled={Boolean(loading)} className="button primary full">{loading === "mark_received" ? "Saving…" : "Mark item received"}</button>}
      {canMarkRefunded && <>
        <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
          Refund reference <span style={{ fontWeight: 400, color: "var(--muted)" }}>(required)</span>
          <input value={refundReference} onChange={(event) => setRefundReference(event.target.value)} placeholder="Provider transaction or manual reference" />
        </label>
        <button onClick={() => decide("mark_refunded")} disabled={Boolean(loading)} className="button primary full">{loading === "mark_refunded" ? "Saving…" : "Mark refund issued"}</button>
      </>}
      {!isReviewable && !canMarkReturning && !canMarkReceived && !canMarkRefunded && <p style={{ color: "var(--muted)", fontSize: 13 }}>No further return action is available for this status.</p>}
      {message && (
        <p className={`action-message ${isError ? "error" : "success"}`}>
          {message}
        </p>
      )}
    </>
  );
}
