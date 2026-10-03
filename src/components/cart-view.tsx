"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/demo-data";

export function CartView() {
  const { items, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function placeOrder() {
    if (!items.length) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const result = await response.json() as { displayId?: string; error?: string };
      if (!response.ok || !result.displayId) {
        setError(result.error ?? "Something went wrong. Please try again.");
      } else {
        clear();
        setOrderId(result.displayId);
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  if (orderId) {
    return (
      <section className="checkout-complete">
        <div className="result-icon good">✓</div>
        <p className="eyebrow">ORDER CONFIRMED</p>
        <h1>Your order is on its way.</h1>
        <p>
          Order #{orderId} has been successfully placed. You can track its delivery status in My Orders.
        </p>
        <Link className="button primary" href="/orders">View my orders →</Link>
      </section>
    );
  }

  return (
    <div className="cart-layout">
      <section>
        <p className="eyebrow">YOUR BAG</p>
        <h1>Cart</h1>
        {items.length ? (
          items.map((item) => (
            <article className="cart-item" key={`${item.id}-${item.size}`}>
              <div className="product-art small">
                {item.image.startsWith("http") ? (
                  <img src={item.image} alt={item.name} className="product-image-cover" />
                ) : (
                  item.image
                )}
              </div>
              <div>
                <strong>{item.name}</strong>
                <p>Size {item.size} · Qty {item.quantity}</p>
              </div>
              <strong>{formatPrice(item.price * item.quantity)}</strong>
            </article>
          ))
        ) : (
          <p className="empty-copy" style={{ marginBottom: 24 }}>Your bag is empty. Find something you&apos;ll love.</p>
        )}
        <Link className="text-link" href="/shop">Continue shopping →</Link>
      </section>

      <aside className="checkout-summary">
        <h2>Order summary</h2>
        <div>
          <span>Subtotal</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>{items.length ? "Free" : "—"}</strong>
        </div>
        <div className="total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        {error && <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          disabled={!items.length || loading}
          onClick={placeOrder}
          className="button primary full"
        >
          {loading ? "Placing order…" : "Place order"}
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
          No payment required — this is a demo store.
        </p>
      </aside>
    </div>
  );
}
