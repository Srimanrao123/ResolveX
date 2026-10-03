"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoOrder, ReturnReason } from "@/lib/types";

const reasons: { value: ReturnReason; label: string }[] = [
  { value: "TOO_SMALL", label: "Too small" }, { value: "TOO_LARGE", label: "Too large" },
  { value: "DAMAGED", label: "Damaged" }, { value: "DEFECTIVE", label: "Defective" },
  { value: "WRONG_ITEM", label: "Wrong item" }, { value: "NOT_AS_EXPECTED", label: "Not as expected" },
  { value: "CHANGED_MIND", label: "Changed my mind" }
];

export function ReturnForm({ order }: { order: DemoOrder }) {
  const router = useRouter();
  const [reason, setReason] = useState<ReturnReason>("TOO_SMALL");
  const [message, setMessage] = useState("");
  const [resolution, setResolution] = useState("refund");
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidencePath, setEvidencePath] = useState<string | null>(null);
  const [evidenceContentType, setEvidenceContentType] = useState<string | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const needsEvidence = useMemo(() => reason === "DAMAGED" || reason === "DEFECTIVE", [reason]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true);
    const endpoint = order.orderItemId ? "/api/returns" : "/api/returns/evaluate";
    let assessment: "yes" | "no" | "unclear" | undefined = hasEvidence ? "unclear" : undefined;
    if (order.orderItemId && evidencePath && evidenceContentType && needsEvidence) {
      const reviewed = await fetch("/api/returns/evidence-review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ evidencePath, contentType: evidenceContentType, reason }) });
      const review = await reviewed.json().catch(() => null) as { supportsClaim?: "yes" | "no" | "unclear" } | null;
      assessment = review?.supportsClaim ?? "unclear";
    }
    const payload = order.orderItemId ? {
      orderItemId: order.orderItemId, reason, requestedResolution: resolution, hasEvidence,
      evidenceAssessment: assessment, evidencePath, evidenceContentType, customerMessage: message
    } : {
      deliveredAt: order.deliveredAt, amount: order.price, reason, hasEvidence,
      evidenceAssessment: assessment,
      recentReturns: reason === "DAMAGED" ? 5 : 1,
      recentDamageClaims: reason === "DAMAGED" ? 3 : 0,
      isFinalSale: order.id === "TH10071"
    };
    const response = await fetch(endpoint, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => null) as { outcome?: string } | null;
    const target = result?.outcome === "APPROVED" ? "approved" : result?.outcome === "MORE_INFO_REQUIRED" ? "more-info" : result?.outcome === "NOT_ELIGIBLE" ? "not-eligible" : "RET-2048";
    router.push(`/returns/${target}?order=${order.id}&resolution=${resolution}`);
  }

  async function addEvidence(file?: File) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) { setEvidenceMessage("Choose a JPG, PNG, or WebP image smaller than 5 MB."); return; }
    if (!order.orderItemId) { setHasEvidence(true); setEvidenceMessage("Photo added for demo review."); return; }
    setUploadingEvidence(true); setEvidenceMessage("");
    const form = new FormData(); form.append("file", file);
    const response = await fetch("/api/returns/evidence-upload", { method: "POST", body: form });
    const result = await response.json() as { path?: string; contentType?: string; error?: string };
    setUploadingEvidence(false);
    if (!response.ok || !result.path || !result.contentType) { setEvidenceMessage(result.error ?? "We could not upload that photo. Please try again."); return; }
    setEvidencePath(result.path); setEvidenceContentType(result.contentType); setHasEvidence(true); setEvidenceMessage("Photo uploaded. It will be reviewed when you continue.");
  }

  return <form className="return-form" onSubmit={submit}>
    <section className="selected-order"><div className="product-art small">{order.image}</div><div><p className="order-number">ORDER #{order.id}</p><h2>{order.product}</h2><p>Delivered {new Date(order.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p></div></section>
    <label><span>Why are you returning this?</span><select value={reason} onChange={event => setReason(event.target.value as ReturnReason)}>{reasons.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label><span>Tell us a little more <i>(optional)</i></span><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="For example: The fit around the shoulders is too tight." rows={4} /></label>
    <fieldset><legend>What would you prefer?</legend><div className="choice-row"><label><input checked={resolution === "refund"} onChange={() => setResolution("refund")} name="resolution" type="radio" /> Refund</label><label><input checked={resolution === "exchange"} onChange={() => setResolution("exchange")} name="resolution" type="radio" /> Exchange</label></div></fieldset>
    {needsEvidence && <section className="evidence-box"><strong>Add a photo of the issue</strong><p>A photo helps us review damage and defect claims faster.</p><label className="upload"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => addEvidence(event.target.files?.[0])} />{uploadingEvidence ? "Uploading…" : hasEvidence ? "Photo added ✓" : "Choose photo"}</label>{evidenceMessage && <p className="evidence-message">{evidenceMessage}</p>}</section>}
    <button className="button primary full" disabled={loading || uploadingEvidence}>{loading ? "Checking your return…" : "Continue"}</button>
  </form>;
}
