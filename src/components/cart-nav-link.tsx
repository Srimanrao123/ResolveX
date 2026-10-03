"use client";

import Link from "next/link";
import { useCart } from "@/components/cart-provider";

export function CartNavLink() {
  const { items } = useCart();
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      className="cart-nav-link"
      aria-label={`Shopping cart with ${totalCount} items`}
    >
      <span className="cart-icon-wrapper">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="cart-icon"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        {totalCount > 0 && (
          <span className="cart-badge" key={totalCount}>
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </span>
      <span className="cart-label">Cart</span>
    </Link>
  );
}
