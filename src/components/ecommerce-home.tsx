"use client";

import { useState } from "react";
import Link from "next/link";
import { HomeCarousel } from "@/components/home-carousel";
import { formatPrice } from "@/lib/demo-data";
import { products, type StoreProduct } from "@/lib/products";
import type { DemoOrder } from "@/lib/types";

type EcommerceHomeProps = {
  profile?: {
    id: string;
    email: string;
    full_name: string | null;
    role: "customer" | "seller";
  } | null;
  recentOrders?: DemoOrder[];
  isDemo?: boolean;
};

const categories = ["All", "T-Shirts", "Shirts", "Jackets", "Shoes", "Dresses", "Trousers"];

export function EcommerceHome({ profile, recentOrders = [] }: EcommerceHomeProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const lastOrder = recentOrders[0];

  return (
    <div className="ecommerce-home">
      {/* ─── Top Store Announcement Ribbon ────────────────────────── */}
      <div className="store-announcement">
        <p>
          ✨ <strong>Complimentary Express Shipping</strong> on orders over ₹1,999 · <strong>14-Day Hassle-Free Returns</strong> powered by ResolveX
        </p>
      </div>

      {/* ─── Hero Fashion Carousel ─────────────────────────────────── */}
      <HomeCarousel />

      <div className="store-body">
        {/* ─── Store Trust & Value Propositions ─────────────────────── */}
        <section className="store-trust-grid">
          <div className="trust-card">
            <span className="trust-icon">🚚</span>
            <div>
              <strong>Free Express Shipping</strong>
              <p>On all domestic orders over ₹1,999 with carbon-neutral transit.</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon">⚡</span>
            <div>
              <strong>14-Day Smart Returns</strong>
              <p>Instant automated approvals and prepaid return labels via ResolveX.</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon">🌿</span>
            <div>
              <strong>Conscious Craft</strong>
              <p>100% certified organic cotton, regenerative denim, and European linen.</p>
            </div>
          </div>
          <div className="trust-card">
            <span className="trust-icon">🔒</span>
            <div>
              <strong>Secure &amp; Protected</strong>
              <p>Encrypted checkout with UPI, Cards, Netbanking, and Cash on Delivery.</p>
            </div>
          </div>
        </section>

        {/* ─── Category Filter Strip ────────────────────────────────── */}
        <section className="catalog-section">
          <div className="catalog-header">
            <div>
              <p className="eyebrow">CURATED COLLECTION</p>
              <h2>Trending Essentials</h2>
              <p className="catalog-sub">Thoughtfully tailored pieces designed for effortless daily wear.</p>
            </div>
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Product Grid with Real Photography ──────────────────── */}
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <Link className="product-card" href={`/shop/${product.id}`} key={product.id}>
                <div className="store-art">
                  {product.badge && <span className="badge">{product.badge}</span>}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-image-cover"
                    loading="lazy"
                  />
                </div>
                <p className="cat-label">{product.category}</p>
                <h2>{product.name}</h2>
                {product.rating && (
                  <p className="product-rating">
                    <span className="stars">★★★★★</span>
                    <span className="score">{product.rating}</span>
                    <span className="count">({product.reviewsCount})</span>
                  </p>
                )}
                <strong>{formatPrice(product.price)}</strong>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Customer Recent Purchase Strip (Discreet & Helpful) ──── */}
        {profile && lastOrder && (
          <section className="customer-order-strip">
            <div className="order-strip-content">
              <div className="order-strip-art">
                <img
                  src={lastOrder.image}
                  alt={lastOrder.product}
                  className="product-image-cover"
                />
              </div>
              <div className="order-strip-info">
                <span className="order-strip-badge">Recent Delivery</span>
                <h3>{lastOrder.product}</h3>
                <p suppressHydrationWarning>
                  Delivered on{" "}
                  {new Date(lastOrder.deliveredAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · Order #{lastOrder.id}
                </p>
              </div>
              <div className="order-strip-actions">
                <Link
                  href={`/returns/new?order=${lastOrder.id}${lastOrder.orderItemId ? `&item=${lastOrder.orderItemId}` : ""}`}
                  className="button primary"
                >
                  Return or Exchange →
                </Link>
                <Link href="/orders" className="button ghost">
                  View All Orders ({recentOrders.length})
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ─── Editorial Brand Story Section ────────────────────────── */}
        <section className="editorial-banner">
          <div className="editorial-art">
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1000&auto=format&fit=crop"
              alt="ResolveX studio craftsmanship"
              className="product-image-cover"
            />
          </div>
          <div className="editorial-copy">
            <p className="eyebrow">OUR PHILOSOPHY</p>
            <h2>Crafted to last. Designed for quiet confidence.</h2>
            <p>
              Every garment at ResolveX begins with responsible textiles and ends with timeless silhouettes that outlive seasonal trends.
            </p>
            <div className="editorial-perks">
              <div className="editorial-stat">
                <strong>100%</strong>
                <span>Regenerative organic cotton</span>
              </div>
              <div className="editorial-stat">
                <strong>Zero</strong>
                <span>Synthetic microplastic blends</span>
              </div>
              <div className="editorial-stat">
                <strong>Instant</strong>
                <span>ResolveX protected</span>
              </div>
            </div>
            <Link href="/shop" className="button primary">
              Explore The Catalog →
            </Link>
          </div>
        </section>

        {/* ─── Newsletter Signup Strip ──────────────────────────────── */}
        <section className="newsletter-card">
          <div>
            <p className="eyebrow">RESOLVEX ESSENTIALS</p>
            <h2>Stay in the loop</h2>
            <p>Enjoy 10% off your next order, seasonal style guides, and early access to drops.</p>
          </div>
          {subscribed ? (
            <div className="newsletter-success">
              ✓ You&apos;re subscribed! Welcome to the collective.
            </div>
          ) : (
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (email) setSubscribed(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
              />
              <button type="submit" className="button primary">
                Subscribe
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
