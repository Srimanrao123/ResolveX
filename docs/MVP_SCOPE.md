# ReturnGuard AI — MVP Scope

## Product statement

ReturnGuard investigates each return against the order, seller policy, evidence, and customer history before recommending the next action.

For the hackathon, demonstrate the full loop with a fictional clothing store. Do not build real store integrations, payment/refund integrations, shipping-label generation, notifications, or a general-purpose chatbot.

## Users

| User | Needs | MVP experience |
| --- | --- | --- |
| Customer | A quick way to return a purchased item | Select an order, explain the issue, add a photo when needed, and see the result/status. |
| Seller | Confidence that risky cases are not auto-refunded | See the queue, open a complete case summary, and approve or reject review cases. |

## Required screens

1. **Store / My orders** — minimal clothing storefront plus seeded delivered orders.
2. **Start return** — customer selects an eligible item, desired resolution, and enters a reason in natural language.
3. **Evidence step** — only shown for `Damaged` or `Defective`; accepts one image.
4. **Decision/status page** — shows the case outcome and a simple timeline.
5. **Seller dashboard** — headline stats, return queue, and one useful product insight.
6. **Seller case review** — order, policy result, evidence, customer history, risk signals, Claude summary, and approve/reject action.

## The only four outcomes

| Outcome | Rule for MVP |
| --- | --- |
| `APPROVED` | Eligible, complete, and low risk. |
| `MORE_INFO_REQUIRED` | Damage/defect claim has no image. |
| `SELLER_REVIEW` | Eligible but medium/high risk, unclear evidence, or order value over the auto-approval threshold. |
| `NOT_ELIGIBLE` | Outside the return window or a non-returnable item. |

## Rules first, AI second

Claude should never be the sole source of a money or policy decision. Application code owns these fixed demo rules:

- Return window: 30 days after delivery.
- Sale/final-sale products: not eligible.
- Damage and defect claims require a photo.
- Auto-approve only when risk is low and value is at most ₹5,000.
- Escalate when the customer has 3+ returns in the past 60 days, 2+ prior damage claims, high order value, or unclear evidence.

Claude adds intelligence by converting the typed reason into a standard category, assessing whether a photo appears consistent with a claim, and drafting a seller-friendly explanation.

## Seeded demo cases

Ship these instead of relying on live data:

| Case | Input | Expected outcome | Why it matters |
| --- | --- | --- | --- |
| Size return | “The shirt is too tight”, normal customer, delivered 10 days ago | Approved | Demonstrates a fast, safe automatic outcome. |
| Missing photo | “The jacket has a tear”, no upload | More info required | Demonstrates the agent asking for what is missing. |
| Suspicious damage | Damaged shoes, photo with unclear damage, customer with repeated damage returns | Seller review | Demonstrates protection and seller control. |
| Late return | Delivered 40 days ago | Not eligible | Demonstrates policy-driven consistency. |

## Deliberately out of scope

- Shopify/WooCommerce APIs
- Real payment refunds, exchanges, pickups, labels, or courier tracking
- Email/SMS/WhatsApp
- Multi-store tenancy and production-grade permissions
- Fraud labels or automated fraud accusations
- Complex analytics, custom policy builders, and model training
- Multiple evidence files or video

## Definition of done

An evaluator can complete the four seeded cases, see the correct result, open the escalated case as a seller, understand why it was escalated, make a final decision, and see a product-return insight.

