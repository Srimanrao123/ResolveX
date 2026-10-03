"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { StoreProduct } from "@/lib/products";

export function AddToCart({ product }: { product: StoreProduct }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [added, setAdded] = useState(false);

  function handleAdd() {
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
      <button
        type="button"
        className={`button primary full ${added ? "is-added" : ""}`}
        onClick={handleAdd}
      >
        {added ? "✓ Added to cart!" : "Add to cart"}
      </button>
      {added && (
        <p className="add-to-cart-hint">
          ✓ Added to bag — <Link href="/cart" className="text-link">View Cart →</Link>
        </p>
      )}
    </div>
  );
}
