# ReturnGuard AI — Technical Plan

## Minimal data model

Use these entities only. They may start as seed objects and move to tables later.

| Entity | Key fields |
| --- | --- |
| `Customer` | id, name, email |
| `Product` | id, name, price, category, finalSale |
| `Order` | id, customerId, deliveredAt, status |
| `OrderItem` | id, orderId, productId, quantity, price |
| `ReturnCase` | id, orderItemId, customerId, reason, requestedResolution, evidenceUrl, status, riskLevel, outcome, summary |
| `ReturnHistory` | customerId, reason, createdAt, outcome |

## Decision engine

```text
validate order ownership and delivery
  → outside 30 days or final-sale? NOT_ELIGIBLE
  → damage/defect with no photo? MORE_INFO_REQUIRED
  → calculate risk from history, order value, and image confidence
  → high/medium risk? SELLER_REVIEW
  → otherwise APPROVED
```

Return a structured result such as:

```ts
{
  outcome: "APPROVED" | "MORE_INFO_REQUIRED" | "SELLER_REVIEW" | "NOT_ELIGIBLE",
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  reasons: string[],
  requiresEvidence: boolean,
}
```

## Claude integration

Use one server-only module, `src/lib/claude.ts`, and the `POST /api/ai/case-summary` route. Never call Claude directly from the browser. The current implementation uses the Claude Messages API and falls back to a verified-facts template when the API key is not configured or the API is unavailable.

### Task A: classify the reason

Input: customer message plus permitted categories.

Required JSON output:

```json
{"reason":"DAMAGED","confidence":"high","missingInformation":[]}
```

Allowed categories: `TOO_SMALL`, `TOO_LARGE`, `DAMAGED`, `DEFECTIVE`, `WRONG_ITEM`, `NOT_AS_EXPECTED`, `CHANGED_MIND`, `OTHER`.

### Task B: assess evidence

Input: image and the customer claim. Required JSON output:

```json
{"supportsClaim":"unclear","observation":"No visible tear can be confidently identified."}
```

Allowed `supportsClaim` values: `yes`, `no`, `unclear`. Treat `unclear` as a risk signal, never as proof of wrongdoing.

### Task C: write the seller summary

Input only the already verified facts: eligibility, policy result, history counts, evidence assessment, risk signals, and recommended action. Output a brief 3–5 sentence explanation; do not let it invent facts.

## API-key safety

- Put `ANTHROPIC_API_KEY` in `.env.local`; never commit it or expose it through `NEXT_PUBLIC_`.
- Invoke Claude from a route handler or server action.
- Validate image type/size before sending it.
- Build a no-key fallback that uses deterministic reason mapping and a template case summary so the demo does not fail if the API is unavailable.

Example environment file:

```bash
ANTHROPIC_API_KEY=your_key_here
```

## Honest AI UX

Show the recommendation and its signals, not a claim that the system found fraud. Example: “Seller review recommended: 3 damage-related returns in 60 days; uploaded photo is inconclusive.” The seller remains the final decision-maker for escalated cases.
