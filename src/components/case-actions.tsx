"use client";

import { useState } from "react";

export function CaseActions({ returnId }: { returnId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function decide(decision: "approve" | "reject" | "request_info") {
    setLoading(decision); setMessage("");
    try {
      const response = await fetch(`/api/seller/returns/${returnId}/decision`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(response.status === 503 ? `Demo mode: ${decision.replace("_", " ")} action recorded.` : result.error ?? "We could not save that decision.");
      } else setMessage(`Return ${decision.replace("_", " ")}ed successfully.`);
    } catch { setMessage("Unable to reach the server. Please try again."); }
    finally { setLoading(null); }
  }

  return <>
    <button onClick={() => decide("approve")} disabled={Boolean(loading)} className="button primary full">{loading === "approve" ? "Saving…" : "Approve return"}</button>
    <button onClick={() => decide("reject")} disabled={Boolean(loading)} className="button danger full">{loading === "reject" ? "Saving…" : "Reject return"}</button>
    <button onClick={() => decide("request_info")} disabled={Boolean(loading)} className="button ghost full">{loading === "request_info" ? "Saving…" : "Request information"}</button>
    {message && <p className="action-message">{message}</p>}
  </>;
}
