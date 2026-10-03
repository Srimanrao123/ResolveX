"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { StoreProduct } from "@/lib/products";

type CartItem = Pick<StoreProduct, "id" | "name" | "price" | "image"> & { size: string; quantity: number };
const CartContext = createContext<{ items: CartItem[]; add: (product: StoreProduct, size: string) => void; clear: () => void } | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const value = useMemo(() => ({ items, add(product: StoreProduct, size: string) { setItems(previous => { const found = previous.find(item => item.id === product.id && item.size === size); return found ? previous.map(item => item === found ? { ...item, quantity: item.quantity + 1 } : item) : [...previous, { id: product.id, name: product.name, price: product.price, image: product.image, size, quantity: 1 }]; }); }, clear() { setItems([]); } }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("CartProvider missing"); return context; }
