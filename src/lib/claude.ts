type SummaryInput = {
  product: string;
  reason: string;
  policyResult: string;
  riskSignals: string[];
  evidenceAssessment: string;
  recommendation: string;
};

export async function createCaseSummary(input: SummaryInput) {
  const fallback = `${input.policyResult}. ${input.evidenceAssessment} ${input.riskSignals.join(" ")} Recommendation: ${input.recommendation}`;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { summary: fallback, source: "template" as const };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      system: "You write concise seller-facing return summaries. Use only the facts supplied. Never say fraud, never invent facts, and state uncertainty plainly. Return 3 short sentences.",
      messages: [{ role: "user", content: JSON.stringify(input) }]
    })
  });

  if (!response.ok) return { summary: fallback, source: "template" as const };
  const payload = await response.json() as { content?: { type: string; text?: string }[] };
  const text = payload.content?.find(block => block.type === "text")?.text?.trim();
  return { summary: text || fallback, source: text ? "claude" as const : "template" as const };
}
