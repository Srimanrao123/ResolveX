"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CaseActions({ returnId, currentStatus }: { returnId: string; currentStatus?: string }) {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function decide(decision: "approve" | "reject" | "request_info") {
    setLoading(decision);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch(`/api/seller/returns/${returnId}/decision`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
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

  return (
    <>
      <button
        onClick={() => decide("approve")}
        disabled={Boolean(loading)}
        className="button primary full"
      >
        {loading === "approve" ? "Saving…" : "Approve return"}
      </button>
      <button
        onClick={() => decide("reject")}
        disabled={Boolean(loading)}
        className="button danger full"
      >
        {loading === "reject" ? "Saving…" : "Reject return"}
      </button>
      <button
        onClick={() => decide("request_info")}
        disabled={Boolean(loading)}
        className="button ghost full"
      >
        {loading === "request_info" ? "Saving…" : "Request information"}
      </button>
      {message && (
        <p className={`action-message ${isError ? "error" : "success"}`}>
          {message}
        </p>
      )}
    </>
  );
}
