# ReturnGuard AI — Complete Product Plan

## Vision

ReturnGuard AI is an autonomous return-operations agent for small and medium-sized e-commerce businesses. A seller should be able to say, “Handle my returns,” and have ReturnGuard resolve normal cases, bring exceptions to the seller, and learn what returns are teaching the business.

It is not only a chatbot or a return form. It behaves like a virtual return-department employee: it investigates a case before taking action.

## The problem

Every return can require a seller to manually answer several questions:

- Is this a real order, and was it delivered?
- Is the item within the return window and allowed by policy?
- What does the customer’s reason mean in a structured way?
- Is a photo or other evidence required, and does it support the claim?
- Does the customer have an unusual return pattern?
- Should the customer receive a refund, replacement, exchange, more questions, or a seller review?

Large marketplaces automate much of this work. Small sellers frequently either spend too much time checking cases or approve everything and absorb avoidable losses.

## Product promise: Resolve, Protect, Learn

| Layer | What ReturnGuard does | Value |
| --- | --- | --- |
| **Resolve** | Runs the customer return flow and automatically handles straightforward cases. | Less manual support work and faster customer experience. |
| **Protect** | Checks policy, evidence, order context, and return history before high-impact decisions. | Sellers do not blindly approve unusual cases. |
| **Learn** | Aggregates structured return reasons and identifies product, listing, sizing, quality, or packaging patterns. | Returns become business intelligence instead of a cost sink. |

## End-to-end return lifecycle

```text
Customer starts return
  → ReturnGuard identifies order and item
  → understands reason
  → checks seller policy
  → requests missing evidence only when needed
  → assesses evidence and customer history
  → calculates risk and next action
  → approves / requests clarification / escalates / declines
  → tracks return, pickup, receipt, refund/replacement/exchange
  → adds case data to return intelligence
```

### The five investigation questions

1. **Is it a valid order?** The order exists, belongs to the customer, was delivered, and was not already refunded/returned.
2. **Is it allowed?** The request satisfies the merchant’s return window, category exclusions, sale-item conditions, and other policy rules.
3. **What is the customer claiming?** Natural language is converted to a standard reason.
4. **Is the claim supported where evidence is needed?** Damage/defect claims can require an image; size claims normally do not.
5. **Is there additional risk?** The system considers past returns, repeated reasons, active claims, high-value items, and unclear evidence.

## Standard return reasons

`Too Small`, `Too Large`, `Damaged`, `Defective`, `Wrong Item`, `Not as Expected`, `Changed Mind`, and `Other`.

These structured labels allow both decisions today and useful product analytics later.

## Decision system

There are only four return decisions in the product. Keeping these stable makes the agent understandable to both customers and sellers.

| Decision | Meaning | Typical example |
| --- | --- | --- |
| **Approve** | The request is eligible, complete, and low risk. | A normal customer requests a size return inside the window. |
| **Clarify** | The request lacks required information. | A damage claim has no photo. |
| **Seller review** | The case is eligible but unusual, unclear, or financially important. | Repeated damage claims plus an inconclusive image. |
| **Decline** | The request fails a seller policy. | Item was delivered outside the 30-day window. |

The product should describe signals and uncertainty, not accuse anyone of fraud. “Seller review recommended” is safer and more useful than “fraud detected.”

## Resolution options after approval

An approved case can lead to one of three resolutions, based on the customer request, policy, stock, and seller choice:

- **Refund** — customer returns the item and receives money back.
- **Replacement** — customer receives another unit of the same item, especially for defective products.
- **Exchange** — customer returns one size/version and chooses another.

The product tracks the downstream timeline: `Requested → Approved → Pickup/Return in transit → Received → Refund/replacement/exchange → Completed`.

## Customer history and risk assessment

ReturnGuard should calculate transparent risk levels rather than opaque fraud scores.

| Level | Meaning | Example signals |
| --- | --- | --- |
| Low | A normal return with no material concern. | Eligible order, sensible reason, normal history. |
| Medium | Something is unusual, but the claim is not clearly unsafe. | Several recent returns or incomplete/unclear evidence. |
| High | Multiple signals suggest the seller should decide. | Repeated damage claims, high value, and an image that does not clearly support the claim. |

Signals can include: previous return count, frequency, repeated return reasons, previous seller-review cases, concurrent requests, item value, and evidence clarity.

## AI responsibilities vs. business rules

| Claude / AI investigates and communicates | Business rules decide and execute |
| --- | --- |
| Understands the customer’s language | Return window and exclusions |
| Maps text to a standard reason | Auto-approval threshold |
| Identifies missing information | Evidence requirements |
| Reviews provided image evidence | Refund / replacement / exchange permissions |
| Explains history and risk signals | Which cases require human approval |
| Writes case summaries and weekly insights | Final merchant action for escalated cases |

This separation is a core product principle: the model interprets context; explicit seller policy controls financial decisions.

## Seller intelligence

ReturnGuard should create a feedback loop rather than simply close tickets.

```text
Customer returns product
  → reason is structured and case is investigated
  → case data is stored
  → patterns are detected across products/customers/reasons
  → seller receives a recommendation
  → product listing, quality, sizing, or packaging improves
  → future returns can decrease
```

Initial insights include:

- A product has a high share of `Too Small` or `Too Large` returns → review size chart and measurements.
- A product/category has rising `Damaged` or `Defective` returns → investigate supplier, quality control, or packaging.
- Customers cite `Not as Expected` repeatedly → improve product images and description.
- A small group creates a disproportionate share of high-risk cases → ensure those cases receive human review.

## Weekly AI digest

The seller can receive a concise report instead of studying dashboards daily:

> 126 returns processed. 82% were automatically resolved. 11 needed manual review. The leading reason was Too Small (31%). Oversized Cotton T-Shirt had a 42% increase in sizing-related returns. Recommended action: review its size chart and measurements.

## Product phases

| Phase | Goal | Includes |
| --- | --- | --- |
| **Hackathon MVP** | Prove the investigate → decide → review loop. | Fictional store, seeded orders/history, one photo, four decisions, customer status, seller queue/review, one insight, Claude summaries. |
| **Beta** | Make it usable by an early merchant. | Merchant policy settings, customer/seller auth, persistent data, multiple product categories, actual return-status updates, weekly digest. |
| **Product v1** | Connect return operations to real commerce. | Shopify/WooCommerce integration, inventory lookup, refund/replacement workflows, shipping/pickup providers, notifications, configurable approval limits. |
| **Scale** | Make intelligence increasingly valuable. | Multi-store support, policy templates, richer analytics, detection tuning from merchant decisions, quality and supplier reporting. |

