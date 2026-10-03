# ReturnGuard AI — Build Plan

## Recommended stack

- **Next.js + TypeScript** for one fast full-stack web app.
- **Tailwind CSS** and a small component set for a polished interface.
- **Supabase** for Postgres, image storage, and simple authentication; if time is tight, start with seeded local data and add Supabase only after the UI works.
- **Claude API** (Anthropic Messages API) on server-side routes only for reason classification, image assessment, and summaries.
- **Vercel** for deployment.

## Build order

### 1. Make the visual shell

Build the customer and seller routes with hard-coded data first. Prioritize an attractive, complete walkthrough over feature depth.

- `/orders` — customer orders.
- `/returns/new/[orderItemId]` — return flow.
- `/returns/[returnId]` — customer decision/timeline.
- `/seller` — dashboard and queue.
- `/seller/returns/[returnId]` — case review.

### 2. Add realistic seeded data

Create products, customers, orders, return history, and the four demo cases from the scope document. Make the seller queue meaningful immediately.

### 3. Build the return intake flow

Collect product, requested resolution (`refund` / `exchange`), typed reason, and an optional photo. Show simple investigation progress after submission.

### 4. Implement the deterministic decision engine

Write a single `evaluateReturn()` function. It accepts order data, policy, customer history, the structured reason, and evidence status; it returns outcome, risk level, and human-readable reasons. Unit-test its four primary paths.

### 5. Add Claude as a focused assistant

Call Claude only after validating the input. Request a small JSON response for the reason category and evidence assessment. Feed that response into the rules engine, then ask Claude to create the seller summary from the already-computed facts.

### 6. Finish seller review and insight

Allow an escalated case to become approved or rejected. Display one insight calculated from seeded completed returns, such as: “34% of returns for Oversized Cotton T-Shirt cite sizing.”

### 7. Polish and deploy

Add loading states, empty/error states, a clear “AI recommendation” label, responsive layouts, and demo reset data. Deploy once the four demo paths work end-to-end.

## Time-boxed hackathon schedule

| Time | Deliverable |
| --- | --- |
| Hours 1–2 | Routes, design system, and seeded data. |
| Hours 3–4 | Customer order selection, reason input, evidence upload, result screen. |
| Hours 5–6 | Policy/risk engine and seller dashboard/case screen. |
| Hour 7 | Claude integration and graceful fallback text. |
| Hours 8–9 | Test four cases, mobile polish, deploy, prepare pitch. |

## Priority if time runs short

Keep: size auto-approval, damage escalation, seller case review, policy decline, Claude summary.

Cut first: storefront browsing/cart, live authentication, database migration, actual image storage, exchange fulfillment, and multiple analytics charts.

