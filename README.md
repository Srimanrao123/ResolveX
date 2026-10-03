# ReturnGuard AI

ReturnGuard AI is an AI-powered return department for small and medium-sized e-commerce sellers. It investigates each return against the order, seller rules, evidence, and customer history before resolving it or escalating it to the seller.

The plan preserves the full product vision while separating a convincing hackathon MVP from the capabilities built after the hackathon. See the plans in [`docs/`](docs/).

## Core demo

1. A customer opens a seeded delivered order and starts a return.
2. They provide a reason in plain language and, for damage/defect claims, upload a photo.
3. ReturnGuard checks fixed seller rules and customer-history risk signals.
4. Claude classifies the reason, reviews relevant image evidence, and writes a case summary.
5. The customer receives **Approved**, **More information required**, **Under seller review**, or **Not eligible**.
6. The seller can inspect review cases and approve or reject them.

## Plans

- [Complete product plan](docs/PRODUCT_PLAN.md)
- [Customer and seller portal plan](docs/PORTAL_PLAN.md)
- [MVP scope](docs/MVP_SCOPE.md)
- [Build plan](docs/BUILD_PLAN.md)
- [Technical plan](docs/TECHNICAL_PLAN.md)
- [Demo plan](docs/DEMO_PLAN.md)
