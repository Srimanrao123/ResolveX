"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ResolveXLogo } from "@/components/resolve-x-logo";
import type { DemoOrder, ReturnReason } from "@/lib/types";

type Step =
  | "greeting"
  | "confirm_order"
  | "reason_input"
  | "custom_reason"
  | "resolution"
  | "evidence"
  | "submitting"
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
  { value: "OTHER", label: "Other / Custom reason", emoji: "✏️" },
];

function uid() {
  return Math.random().toString(36).slice(2);
}

export function ReturnChat({ order }: { order: DemoOrder }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("greeting");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reason, setReason] = useState<ReturnReason | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [resolution, setResolution] = useState<"refund" | "exchange">("refund");
  const [customMessage, setCustomMessage] = useState("");
  const [hasEvidence, setHasEvidence] = useState(false);
  const [evidencePath, setEvidencePath] = useState<string | null>(null);
  const [evidenceContentType, setEvidenceContentType] = useState<string | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const needsEvidence = reason === "DAMAGED" || reason === "DEFECTIVE";

  function addMessage(from: "agent" | "user", text: string) {
    setMessages((prev) => [...prev, { id: uid(), from, text }]);
  }

  // Scroll to bottom whenever messages or step change
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages, step]);

  // Initialize or re-initialize conversation whenever the order changes
  useEffect(() => {
    setMessages([]);
    setStep("greeting");
    setReason(null);
    setCustomReason("");
    setResolution("refund");
    setCustomMessage("");
    setHasEvidence(false);
    setEvidencePath(null);
    setEvidenceContentType(null);
    setEvidenceMessage("");
    setLoading(false);

    const t1 = setTimeout(() => {
      setMessages([
        {
          id: uid(),
          from: "agent",
          text: `Hi there 👋 We're here to help with your order for **${order.product}** (Order #${order.id}).`,
        },
      ]);
      const t2 = setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            from: "agent",
            text: "How can we help you with this order today?",
          },
        ]);
        setStep("confirm_order");
      }, 700);
      return () => clearTimeout(t2);
    }, 300);

    return () => clearTimeout(t1);
  }, [order.id, order.orderItemId, order.product]);

  function confirmOrder() {
    addMessage("user", "I want to return or exchange this item.");
    setTimeout(() => {
      addMessage(
        "agent",
        "Got it! What is the reason for your request? Please select an option or pick 'Other' to describe it."
      );
      setStep("reason_input");
    }, 500);
  }

  function selectReason(r: ReturnReason) {
    if (r === "OTHER") {
      setReason("OTHER");
      addMessage("user", "Other / Custom reason");
      setTimeout(() => {
        addMessage(
          "agent",
          "Please describe your reason for return below so our customer care team can assist you appropriately:"
        );
        setStep("custom_reason");
      }, 500);
      return;
    }

    const label = reasonOptions.find((opt) => opt.value === r)?.label ?? r;
    setReason(r);
    addMessage("user", label);
    setTimeout(() => {
      addMessage("agent", "How would you prefer to resolve this? You can also add any notes below.");
      setStep("resolution");
    }, 500);
  }

  function submitCustomReason() {
    if (!customReason.trim()) return;
    addMessage("user", `Reason: ${customReason.trim()}`);
    setTimeout(() => {
      addMessage(
        "agent",
        "Thank you for sharing those details. How would you prefer to resolve this?"
      );
      setStep("resolution");
    }, 500);
  }

  function selectResolution(res: "refund" | "exchange") {
    setResolution(res);
    addMessage("user", res === "refund" ? "I'd like a refund" : "I'd like an exchange");
    if (customMessage.trim()) {
      addMessage("user", customMessage.trim());
    }

    if (needsEvidence) {
      setTimeout(() => {
        addMessage(
          "agent",
          "Since you reported a damage or defect, please attach a clear photo of the item if possible. This helps us expedite your request."
        );
        setStep("evidence");
      }, 600);
    } else {
      setTimeout(() => {
        addMessage("agent", "Thank you. Submitting your request now…");
        setStep("submitting");
        submitReturn({ evidence: false });
      }, 600);
    }
  }

  function skipEvidence() {
    addMessage("user", "I'll skip the photo for now.");
    setTimeout(() => {
      addMessage("agent", "No problem. Submitting your request now…");
      setStep("submitting");
      submitReturn({ evidence: false });
    }, 500);
  }

  async function addEvidence(file?: File) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      setEvidenceMessage("Please choose a JPG, PNG, or WebP image under 5 MB.");
      return;
    }
    if (!order.orderItemId) {
      setHasEvidence(true);
      setEvidenceMessage("Photo attached ✓");
      return;
    }
    setUploadingEvidence(true);
    setEvidenceMessage("Uploading photo…");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/returns/evidence-upload", { method: "POST", body: form });
      const result = (await response.json()) as { path?: string; contentType?: string; error?: string };
      setUploadingEvidence(false);
      if (!response.ok || !result.path || !result.contentType) {
        setEvidenceMessage(result.error ?? "Upload failed. Please try again.");
        return;
      }
      setEvidencePath(result.path);
      setEvidenceContentType(result.contentType);
      setHasEvidence(true);
      setEvidenceMessage("Photo attached ✓");
    } catch {
      setUploadingEvidence(false);
      setEvidenceMessage("Upload failed. Please try again.");
    }
  }

  function submitEvidence() {
    addMessage("user", hasEvidence ? "Photo uploaded." : "Proceeding without photo.");
    setTimeout(() => {
      addMessage("agent", "Thank you! Submitting your return request now…");
      setStep("submitting");
      submitReturn({ evidence: hasEvidence });
    }, 500);
  }

  async function submitReturn({ evidence }: { evidence: boolean }) {
    setLoading(true);
    const endpoint = order.orderItemId ? "/api/returns" : "/api/returns/evaluate";
    let assessment: "yes" | "no" | "unclear" | undefined = evidence ? "unclear" : undefined;

    if (order.orderItemId && evidencePath && evidenceContentType && needsEvidence) {
      try {
        const reviewed = await fetch("/api/returns/evidence-review", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ evidencePath, contentType: evidenceContentType, reason }),
        });
        const review = (await reviewed.json().catch(() => null)) as { supportsClaim?: "yes" | "no" | "unclear" } | null;
        assessment = review?.supportsClaim ?? "unclear";
      } catch {
        assessment = "unclear";
      }
    }

    const compiledMessage = [customReason.trim(), customMessage.trim()]
      .filter(Boolean)
      .join(" — ");

    const payload = order.orderItemId
      ? {
          orderItemId: order.orderItemId,
          reason,
          requestedResolution: resolution,
          hasEvidence: evidence,
          evidenceAssessment: assessment,
          evidencePath,
          evidenceContentType,
          customerMessage: compiledMessage || undefined,
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

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { outcome?: string } | null;

      // Small natural delay so user gets standard feedback
      await new Promise((r) => setTimeout(r, 900));

      setLoading(false);
      setStep("done");

      const target =
        result?.outcome === "APPROVED"
          ? "approved"
          : result?.outcome === "MORE_INFO_REQUIRED"
          ? "more-info"
          : result?.outcome === "NOT_ELIGIBLE"
          ? "not-eligible"
          : "review";

      const outcomeMessages: Record<string, string> = {
        approved:
          "✅ **Return approved!** Your return request has been authorized. A prepaid return shipping label and packing instructions have been sent to your email.",
        "more-info":
          "📸 **Additional details needed:** Please upload a clear photo of the item so we can complete your return review.",
        "not-eligible":
          "ℹ️ **Notice:** This purchase is outside our standard 30-day return window. If you need any assistance, our customer support team is here to help.",
        review:
          "📋 **Request received!** Your return request has been submitted for review. Our customer care team will email you an update within 24 hours.",
      };

      const outcomeMsg = outcomeMessages[target] ?? outcomeMessages.review;
      addMessage("agent", outcomeMsg);

      setTimeout(() => {
        router.push(`/returns/${target}?order=${order.id}&resolution=${resolution}`);
      }, 2000);
    } catch {
      setLoading(false);
      setStep("done");
      addMessage(
        "agent",
        "📋 **Request received!** Your return request has been recorded. Our customer care team will follow up via email."
      );
      setTimeout(() => {
        router.push(`/returns/review?order=${order.id}&resolution=${resolution}`);
      }, 2000);
    }
  }

  const isSubmitting = step === "submitting" || loading;

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
            {order.deliveredAt
              ? `Delivered ${new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`
              : `Status: ${order.status}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.from}`}>
            {msg.from === "agent" && (
              <div className="chat-avatar-rx" aria-label="ResolveX Assistant">
                <ResolveXLogo size="sm" showWordmark={false} />
              </div>
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

        {/* Clean, customer-facing loading indicator */}
        {isSubmitting && (
          <div className="submitting-card">
            <div className="submitting-indicator">
              <span className="submitting-dot" />
              <span className="submitting-dot" />
              <span className="submitting-dot" />
            </div>
            <p className="submitting-title">Processing your request…</p>
            <p className="submitting-subtitle">Please wait while we confirm your return details</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Action area */}
      {step === "confirm_order" && (
        <div className="chat-actions">
          <button className="chat-btn primary" onClick={confirmOrder}>
            I want to return or exchange this item →
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

      {step === "custom_reason" && (
        <div className="chat-input-area">
          <input
            type="text"
            className="chat-text-input"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Type your return reason here…"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && customReason.trim()) {
                submitCustomReason();
              }
            }}
          />
          <div className="chat-actions">
            <button
              type="button"
              className="chat-btn primary"
              disabled={!customReason.trim()}
              onClick={submitCustomReason}
            >
              Continue with this reason →
            </button>
          </div>
        </div>
      )}

      {step === "resolution" && (
        <div className="chat-input-area">
          <textarea
            className="chat-textarea"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Add any extra details or notes… (optional)"
            rows={2}
          />
          <div className="chat-actions spaced">
            <button
              type="button"
              className="chat-btn ghost"
              onClick={() => selectResolution("refund")}
            >
              💳 Refund to original payment
            </button>
            <button
              type="button"
              className="chat-btn ghost"
              onClick={() => selectResolution("exchange")}
            >
              🔄 Exchange for another size
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
                type="button"
                className="chat-btn primary"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingEvidence}
              >
                {uploadingEvidence ? "Uploading photo…" : "📷 Attach photo"}
              </button>
            ) : (
              <div className="evidence-added">
                <span>📷 Photo attached ✓</span>
              </div>
            )}
            {evidenceMessage && <p className="evidence-status">{evidenceMessage}</p>}
          </div>
          <div className="chat-actions spaced">
            <button
              type="button"
              className="chat-btn primary"
              onClick={submitEvidence}
              disabled={uploadingEvidence}
            >
              Submit request →
            </button>
            <button
              type="button"
              className="chat-btn ghost small"
              onClick={skipEvidence}
              disabled={uploadingEvidence}
            >
              Skip photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
