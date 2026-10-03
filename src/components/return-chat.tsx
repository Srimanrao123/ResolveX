"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DemoOrder, ReturnReason } from "@/lib/types";

type Step =
  | "greeting"
  | "confirm_order"
  | "reason_input"
  | "resolution"
  | "evidence"
  | "investigating"
  | "done";

type Message = {
  id: string;
  from: "agent" | "user";
  text: string;
};

const reasonOptions: { value: ReturnReason; label: string; emoji: string }[] = [
  { value: "TOO_SMALL", label: "Too small", emoji: "📏" },
  { value: "TOO_LARGE", label: "Too large", emoji: "📐" },
  { value: "DAMAGED", label: "Damaged / arrived broken", emoji: "📦" },
  { value: "DEFECTIVE", label: "Defective / doesn't work", emoji: "⚠️" },
  { value: "WRONG_ITEM", label: "Wrong item received", emoji: "🔄" },
  { value: "NOT_AS_EXPECTED", label: "Not as described", emoji: "🖼️" },
  { value: "CHANGED_MIND", label: "Changed my mind", emoji: "💭" },
  { value: "OTHER", label: "Something else", emoji: "❓" },
];

const investigationSteps = [
  { label: "Verifying your order", delay: 800 },
  { label: "Checking return policy", delay: 1600 },
  { label: "Understanding return reason", delay: 2400 },
  { label: "Reviewing evidence", delay: 3200 },
  { label: "Checking return history", delay: 4000 },
  { label: "Generating decision", delay: 4800 },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function ReturnChat({ order }: { order: DemoOrder }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [resolution, setResolution] = useState<"refund" | "exchange">("refund");
  const [customMessage, setCustomMessage] = useState("");
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidencePath, setEvidencePath] = useState<string | null>(null);
  const [evidenceContentType, setEvidenceContentType] = useState<string | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [investigationProgress, setInvestigationProgress] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsEvidence = reason === "DAMAGED" || reason === "DEFECTIVE";

  function addMessage(from: "agent" | "user", text: string) {
    setMessages((prev) => [...prev, { id: uid(), from, text }]);
  }

  // Scroll to bottom whenever messages change
  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
  }, [messages, step, investigationProgress]);

  // Start the chat
  useEffect(() => {
    setTimeout(() => {
      addMessage(
        "agent",
        `Hi there 👋 I'm ReturnGuard. I can see your order — **${order.product}** (Order #${order.id}). I'll take care of your return.`
      );
      setTimeout(() => {
        addMessage("agent", "Would you like to start a return for this order?");
        setStep("confirm_order");
      }, 900);
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function confirmOrder() {
    addMessage("user", "Yes, I want to return this order.");
    setTimeout(() => {
      addMessage("agent", "Got it. What's the reason for your return? Please pick the option that best describes the issue.");
      setStep("reason_input");
    }, 600);
  }

  function selectReason(r: ReturnReason) {
    const label = reasonOptions.find((opt) => opt.value === r)?.label ?? r;
    setReason(r);
    addMessage("user", label);
    setTimeout(() => {
      if (customMessage === "") {
        addMessage("agent", "Thanks. Would you like to add any extra details? (optional)");
      }
      setStep("resolution");
    }, 600);
  }

  function submitMessage() {
    if (customMessage.trim()) {
      addMessage("user", customMessage.trim());
    }
    setCustomMessage("");
    setTimeout(() => {
      addMessage("agent", "How would you like this resolved?");
    }, 400);
  }

  function selectResolution(res: "refund" | "exchange") {
    setResolution(res);
    addMessage("user", res === "refund" ? "I'd like a refund" : "I'd like an exchange");
    if (needsEvidence) {
      setTimeout(() => {
        addMessage("agent", "Since you mentioned a damage or defect issue, please upload a photo so I can review it. This helps me process your return faster.");
        setStep("evidence");
      }, 700);
    } else {
      setTimeout(() => {
        addMessage("agent", "Perfect. Let me now investigate your return request…");
        setStep("investigating");
        startInvestigation({ evidence: false });
      }, 700);
    }
  }

  function skipEvidence() {
    addMessage("user", "I'll skip the photo for now.");
    setTimeout(() => {
      addMessage("agent", "No problem. Let me investigate your request…");
      setStep("investigating");
      startInvestigation({ evidence: false });
    }, 600);
  }

  async function addEvidence(file?: File) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setEvidenceMessage("Please choose a JPG, PNG, or WebP image smaller than 5 MB.");
      return;
    }
    if (!order.orderItemId) {
      setHasEvidence(true);
      setEvidenceMessage("Photo added ✓");
      return;
    }
    setUploadingEvidence(true);
    setEvidenceMessage("Uploading…");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/returns/evidence-upload", { method: "POST", body: form });
    const result = await response.json() as { path?: string; contentType?: string; error?: string };
    setUploadingEvidence(false);
    if (!response.ok || !result.path || !result.contentType) {
      setEvidenceMessage(result.error ?? "Upload failed. Please try again.");
      return;
    }
    setEvidencePath(result.path);
    setEvidenceContentType(result.contentType);
    setHasEvidence(true);
    setEvidenceMessage("Photo uploaded ✓");
  }

  function submitEvidence() {
    addMessage("user", hasEvidence ? "Photo uploaded." : "Skipping photo.");
    setTimeout(() => {
      addMessage("agent", "Received. Now let me investigate your return…");
      setStep("investigating");
      startInvestigation({ evidence: hasEvidence });
    }, 600);
  }

  async function startInvestigation({ evidence }: { evidence: boolean }) {
    // Animate investigation steps
    for (let i = 0; i < investigationSteps.length; i++) {
      await new Promise<void>((resolve) =>
        setTimeout(() => {
          setInvestigationProgress((prev) => [...prev, i]);
          resolve();
        }, investigationSteps[i].delay)
      );
    }
    // After animation, submit
    await submitReturn({ evidence });
  }

  async function submitReturn({ evidence }: { evidence: boolean }) {
    setLoading(true);
    const endpoint = order.orderItemId ? "/api/returns" : "/api/returns/evaluate";
    let assessment: "yes" | "no" | "unclear" | undefined = evidence ? "unclear" : undefined;
    if (order.orderItemId && evidencePath && evidenceContentType && needsEvidence) {
      const reviewed = await fetch("/api/returns/evidence-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidencePath, contentType: evidenceContentType, reason }),
      });
      const review = await reviewed.json().catch(() => null) as { supportsClaim?: "yes" | "no" | "unclear" } | null;
      assessment = review?.supportsClaim ?? "unclear";
    }
    const payload = order.orderItemId
      ? {
          orderItemId: order.orderItemId,
          reason,
          requestedResolution: resolution,
          hasEvidence: evidence,
          evidenceAssessment: assessment,
          evidencePath,
          evidenceContentType,
          customerMessage: customMessage || undefined,
        }
      : {
          deliveredAt: order.deliveredAt,
          amount: order.price,
          reason,
          hasEvidence: evidence,
          evidenceAssessment: assessment,
          recentReturns: reason === "DAMAGED" ? 5 : 1,
          recentDamageClaims: reason === "DAMAGED" ? 3 : 0,
          isFinalSale: order.id === "TH10071",
        };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null) as { outcome?: string } | null;
    setLoading(false);
    setStep("done");
    const target =
      result?.outcome === "APPROVED"
        ? "approved"
        : result?.outcome === "MORE_INFO_REQUIRED"
        ? "more-info"
        : result?.outcome === "NOT_ELIGIBLE"
        ? "not-eligible"
        : "RET-2048";

    const outcomeMessages: Record<string, { agent: string; user?: string }> = {
      approved: { agent: "✅ **Return approved!** Your request has been accepted. You'll receive return instructions by email shortly." },
      "more-info": { agent: "📸 We need one more thing — a photo of the issue. I'll redirect you to provide more information." },
      "not-eligible": { agent: "❌ This return is outside the eligible return window or policy. I'll show you the full details." },
      "RET-2048": { agent: "🔍 This return has been sent to the seller for manual review. You'll be notified once they make a decision." },
    };
    const outcomeMsg = outcomeMessages[target] ?? outcomeMessages["RET-2048"];
    addMessage("agent", outcomeMsg.agent);
    setTimeout(() => {
      router.push(`/returns/${target}?order=${order.id}&resolution=${resolution}`);
    }, 2200);
  }

  const isInvestigating = step === "investigating";

  return (
    <div className="chat-shell">
      {/* Order context card */}
      <div className="chat-order-card">
        <div className="chat-order-art">
          {order.image.startsWith("http") ? (
            <img src={order.image} alt={order.product} className="product-image-cover" />
          ) : (
            order.image
          )}
        </div>
        <div>
          <p className="chat-order-label">ORDER #{order.id}</p>
          <p className="chat-order-name">{order.product}</p>
          <p className="chat-order-meta">
            Delivered{" "}
            {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.from}`}>
            {msg.from === "agent" && (
              <div className="chat-avatar">R</div>
            )}
            <div
              className={`chat-bubble ${msg.from}`}
              dangerouslySetInnerHTML={{
                __html: msg.text
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>"),
              }}
            />
          </div>
        ))}

        {/* Investigation progress */}
        {isInvestigating && (
          <div className="investigation-card">
            <p className="investigation-title">Investigating your return…</p>
            <div className="investigation-steps">
              {investigationSteps.map((s, i) => {
                const done = investigationProgress.includes(i);
                const active = !done && investigationProgress.length === i;
                return (
                  <div
                    key={s.label}
                    className={`inv-step ${done ? "done" : active ? "active" : "pending"}`}
                  >
                    <span className="inv-icon">
                      {done ? "✓" : active ? <span className="inv-spinner" /> : "○"}
                    </span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
            {loading && <p className="inv-finalizing">Finalizing decision…</p>}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Action area */}
      {step === "confirm_order" && (
        <div className="chat-actions">
          <button className="chat-btn primary" onClick={confirmOrder}>
            Yes, start my return →
          </button>
        </div>
      )}

      {step === "reason_input" && (
        <div className="chat-reason-grid">
          {reasonOptions.map((opt) => (
            <button
              key={opt.value}
              className="reason-chip"
              onClick={() => selectReason(opt.value)}
            >
              <span className="reason-emoji">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {step === "resolution" && (
        <div className="chat-input-area">
          <textarea
            className="chat-textarea"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add any extra details… (optional)"
            rows={2}
          />
          <div className="chat-actions spaced">
            <button className="chat-btn ghost" onClick={() => { setResolution("refund"); submitMessage(); selectResolution("refund"); }}>
              💳 Refund
            </button>
            <button className="chat-btn ghost" onClick={() => { setResolution("exchange"); submitMessage(); selectResolution("exchange"); }}>
              🔄 Exchange
            </button>
          </div>
        </div>
      )}

      {step === "evidence" && (
        <div className="chat-evidence-area">
          <div className="evidence-upload-zone">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => addEvidence(e.target.files?.[0])}
            />
            {!hasEvidence ? (
              <button
                className="chat-btn primary"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingEvidence}
              >
                {uploadingEvidence ? "Uploading…" : "📷 Upload photo"}
              </button>
            ) : (
              <div className="evidence-added">
                <span>📷 Photo added ✓</span>
              </div>
            )}
            {evidenceMessage && <p className="evidence-status">{evidenceMessage}</p>}
          </div>
          <div className="chat-actions spaced">
            <button
              className="chat-btn primary"
              onClick={submitEvidence}
              disabled={uploadingEvidence}
            >
              Continue →
            </button>
            <button className="chat-btn ghost small" onClick={skipEvidence}>
              Skip photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
