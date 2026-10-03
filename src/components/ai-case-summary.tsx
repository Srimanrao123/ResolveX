"use client";

import { useState } from "react";

type Props = {
  product: string;
  reason: string;
  policyResult: string;
  riskSignals: string[];
  evidenceAssessment: string;
  recommendation: string;
};

export function AiCaseSummary(props: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [source, setSource] = useState<"claude" | "template" | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/case-summary", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(props) });
      const result = await response.json() as { summary?: string; source?: "claude" | "template" };
      if (response.ok && result.summary) { setSummary(result.summary); setSource(result.source ?? "template"); }
      else setSummary("A summary could not be generated right now. The verified investigation details are shown below.");
    } catch { setSummary("A summary could not be generated right now. The verified investigation details are shown below."); }
    finally { setLoading(false); }
  }

  return <section className="case-section ai-summary"><div className="section-title-row"><div><h2>AI case summary</h2><p>Generated from verified investigation facts only.</p></div><button className="text-button" onClick={generate} disabled={loading}>{loading ? "Generating…" : summary ? "Refresh summary" : "Generate summary"}</button></div>{summary ? <><p className="summary-copy">{summary}</p><small>{source === "claude" ? "Generated with Claude" : "Verified-facts fallback"}</small></> : <p className="summary-placeholder">Generate a concise explanation before making a final decision.</p>}</section>;
}
