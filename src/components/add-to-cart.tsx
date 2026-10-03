"use client";

import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import type { StoreProduct } from "@/lib/products";

export function AddToCart({ product }: { product: StoreProduct }) {
  const { add } = useCart(); const [size, setSize] = useState(product.sizes[0]); const [added, setAdded] = useState(false);
  return <div className="purchase-box"><div><span>Choose size</span><div className="size-row">{product.sizes.map(value => <button type="button" onClick={() => setSize(value)} className={size === value ? "size selected" : "size"} key={value}>{value}</button>)}</div></div><button className="button primary full" onClick={() => { add(product, size); setAdded(true); }}> {added ? "Added to cart ✓" : "Add to cart"}</button></div>;
}
