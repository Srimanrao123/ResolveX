"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { StoreProduct } from "@/lib/products";

export function AddToCart({
  product,
  isAuthenticated = false,
}: {
  product: StoreProduct;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);

  function handleAdd() {
    if (!isAuthenticated) {
      setShowAuthWarning(true);
      setTimeout(() => {
        router.push(`/login?redirect=/shop/${product.id}`);
      }, 900);
      return;
    }
    add(product, size);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  }

  return (
    <div className="purchase-box">
      <div>
        <span>Choose size</span>
        <div className="size-row">
          {product.sizes.map((value) => (
            <button
              type="button"
              onClick={() => setSize(value)}
              className={size === value ? "size selected" : "size"}
              key={value}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {isAuthenticated ? (
        <button
          type="button"
          className={`button primary full ${added ? "is-added" : ""}`}
          onClick={handleAdd}
        >
          {added ? "✓ Added to cart!" : "Add to cart"}
        </button>
      ) : (
        <button
          type="button"
          className="button primary full auth-required-btn"
          onClick={handleAdd}
        >
          🔒 Sign in to add to cart
        </button>
      )}

      {showAuthWarning && (
        <p className="auth-cart-warning">
          Please sign in to add items to your cart. Redirecting to sign in…
        </p>
      )}

      {added && (
        <p className="add-to-cart-hint">
          ✓ Added to bag — <Link href="/cart" className="text-link">View Cart →</Link>
        </p>
      )}
    </div>
  );
}
