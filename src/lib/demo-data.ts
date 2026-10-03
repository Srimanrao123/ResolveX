import type { DemoOrder, ReturnCase } from "@/lib/types";

export const demoOrders: DemoOrder[] = [
  { id: "TH10284", product: "Oversized Cotton T-Shirt", price: 1499, deliveredAt: "2026-09-28", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop", status: "DELIVERED" },
  { id: "TH10293", product: "Velocity Runner Sneakers", price: 4999, deliveredAt: "2026-09-23", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400&auto=format&fit=crop", status: "DELIVERED" },
  { id: "TH10071", product: "Classic Denim Jacket", price: 3299, deliveredAt: "2026-08-18", image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=400&auto=format&fit=crop", status: "DELIVERED" }
];

export const reviewCases: ReturnCase[] = [
  {
    id: "RET-2048", orderId: "TH10293", customer: "Rahul Sharma", product: "Premium Running Shoes", amount: 4999,
    reason: "Damaged", status: "Needs review", risk: "HIGH", policy: "Eligible",
    history: "5 previous returns · 3 damage-related claims in 60 days",
    evidence: "The uploaded image does not clearly show the claimed damage.",
    recommendation: "Manual review recommended because repeated damage claims and inconclusive evidence need seller judgment."
  },
  {
    id: "RET-2049", orderId: "TH10284", customer: "Priya Nair", product: "Oversized Cotton T-Shirt", amount: 1499,
    reason: "Too small", status: "Approved", risk: "LOW", policy: "Eligible",
    history: "1 return in the last 6 months", evidence: "No evidence required for size-related return.",
    recommendation: "Approved automatically. The order is eligible and customer history is normal."
  }
];

export const formatPrice = (value: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(value);
