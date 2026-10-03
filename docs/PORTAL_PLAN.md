# ReturnGuard AI — Portal and Storefront Plan

## 1. Connected clothing storefront

The demo includes a simple fictional fashion e-commerce storefront. It makes the return workflow feel real: customers browse, purchase, see delivery status, then begin a return from **My Orders**.

### Storefront pages

| Page | Purpose | MVP level |
| --- | --- | --- |
| Home | Brand introduction, featured products, new arrivals, best sellers. | Visual only / seed data. |
| Shop | Categories: T-shirts, shirts, jeans, trousers, dresses, jackets. | Basic product grid. |
| Product detail | Images, price, size/color choices, size chart, description, add-to-cart. | Basic detail page; no real payment needed. |
| Cart and checkout | Review products, delivery details, order placement. | Optional simulated checkout. |
| My Orders | Delivered orders with item, price, delivery date, and **Start a return**. | Required for the demo. |

The MVP may use pre-created orders rather than a complete real shopping flow. The storefront is context for the return experience, not the main product.

## 2. Customer portal

### Design principle

The customer should feel they are talking to a helpful support agent, not filling out a long, bureaucratic form. The flow can use chat-like language, but should remain structured enough to collect the right data.

### Customer flow

1. **Start return** — customer opens an order and selects the item to return.
2. **Order context** — ReturnGuard already displays product, price, delivery date, quantity, and existing return/refund status.
3. **Reason** — customer chooses or types why they are returning it; Claude maps free text to a standard reason.
4. **Requested resolution** — refund, replacement, or exchange, where the policy supports it.
5. **Evidence** — ReturnGuard asks for a photo only when relevant (for example damaged/defective product claims).
6. **Investigation** — show reassuring, simple progress: `Order verified`, `Policy checked`, `Reason understood`, `Evidence reviewed`, `Return history checked`.
7. **Decision** — show approved, more information required, under seller review, or not eligible with a clear explanation.
8. **Tracking** — show the post-decision timeline through completion.

### Customer-facing messages

| Situation | Example message |
| --- | --- |
| Approved | “Your return has been approved. Follow the return instructions below.” |
| Clarification | “Please upload a photo showing the damaged area so we can continue.” |
| Seller review | “Your request is being reviewed by the seller. We’ll update you soon.” |
| Not eligible | “This item is outside the seller’s 30-day return window.” |
| Refund progress | “Your returned product has been received and your refund is being processed.” |

### Customer portal scope by phase

| Hackathon MVP | Later |
| --- | --- |
| Seeded customer/order, one return at a time, typed reason, one photo, decision/status page | Live account, order lookup, multiple files, pickup selection, labels, notifications, real payment/refund updates |

## 3. Seller portal

### Seller dashboard

The dashboard answers: “What is happening with my returns, and what needs my attention?”

Required cards:

- Total returns
- Automatically resolved returns
- Cases awaiting review
- High-risk cases
- Average resolution time
- Most common return reason

It also presents one prominent AI insight, e.g. “34% of returns for Product X mention sizing. Consider reviewing the size chart.”

### Return queue

The queue separates routine cases from exceptions. Each row shows order ID, customer, product, reason, requested resolution, risk, policy status, and current return status.

Filters: `All`, `Needs Review`, `High Risk`, `Pending Evidence`, `Approved`, `Completed`.

### Case review — the core seller screen

One page gives the seller all decision context:

| Section | Information |
| --- | --- |
| Customer | Name, order count, return count, recent/repeated reasons. |
| Order | Order ID, product, value, purchase/delivery date, current status. |
| Return request | Customer explanation, standard reason, requested resolution. |
| Evidence | Customer photo and Claude’s evidence observation. |
| Policy result | Eligible/not eligible and the specific policy checks. |
| Risk assessment | Low/medium/high plus signals that produced it. |
| AI case summary | Concise verified-facts summary and recommendation. |
| Seller action | Approve, reject, or request more information. |

### Seller decision boundaries

- Routine low-risk cases can be auto-approved based on seller policy.
- Medium/high-risk, unclear, and high-value cases are presented for seller action.
- The seller can override an AI recommendation; overrides become useful feedback for future risk tuning.

## 4. Return intelligence portal

This is the “Learn” layer. Keep it focused and action-oriented rather than turning it into enterprise BI.

### Initial views

- Return reasons by product and category.
- Products with high return rate.
- Size-related return patterns.
- Damage/defect trends.
- Change in return volume over time.
- Cases/customers needing additional attention.
- Weekly AI digest with suggested business action.

### Example recommendations

| Pattern | Recommendation |
| --- | --- |
| 34% of a shirt’s returns cite sizing | Review the size chart and product measurements. |
| Defect returns rising for a jacket | Investigate supplier quality and inspect recent inventory. |
| Product looks different complaints increasing | Improve product photography and description. |
| Damage is concentrated in one category | Review packaging and courier handling. |

