import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";

type CartItem = {
  id: string;      // product slug e.g. "oversized-cotton-tee"
  name: string;
  price: number;
  size: string;
  quantity: number;
  image?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });

  const user = await getCurrentProfile();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ error: "Please sign in as a customer." }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { items?: CartItem[] } | null;
  if (!body?.items?.length) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Ensure profile exists in profiles table
  await supabase.from("profiles").upsert({ id: user.id, email: user.email, role: "customer" }, { onConflict: "id" });

  // Get or create the demo store
  let storeId: string;
  const { data: existingStore } = await supabase.from("stores").select("id").eq("name", "Thread & Hue").maybeSingle();
  if (existingStore) {
    storeId = existingStore.id;
  } else {
    const { data: newStore, error: storeError } = await supabase
      .from("stores")
      .insert({ name: "Thread & Hue", return_window_days: 30, auto_approval_limit: 5000 })
      .select("id")
      .single();
    if (storeError || !newStore) {
      return NextResponse.json({ error: "Could not set up store." }, { status: 500 });
    }
    storeId = newStore.id;
  }

  // Create or find product records in DB
  const itemsWithProductIds: { productId: string; price: number; quantity: number }[] = [];
  for (const item of body.items) {
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("name", item.name)
      .eq("store_id", storeId)
      .maybeSingle();

    let productId: string;
    if (existingProduct) {
      productId = existingProduct.id;
      if (item.image && !existingProduct.image_url) {
        await supabase.from("products").update({ image_url: item.image }).eq("id", existingProduct.id);
      }
    } else {
      const { data: newProduct, error: productError } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: item.name,
          price: item.price,
          category: "Clothing",
          image_url: item.image ?? null,
        })
        .select("id")
        .single();
      if (productError || !newProduct) continue;
      productId = newProduct.id;
    }
    itemsWithProductIds.push({ productId, price: item.price, quantity: item.quantity });
  }

  if (!itemsWithProductIds.length) {
    return NextResponse.json({ error: "No valid products." }, { status: 400 });
  }

  // Create the new order with status ORDERED
  const displayId = `TH${Math.floor(10000 + Math.random() * 90000)}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      display_id: displayId,
      store_id: storeId,
      customer_id: user.id,
      status: "ORDERED",
      delivered_at: null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Could not place order." }, { status: 500 });
  }

  // Create order items
  await supabase.from("order_items").insert(
    itemsWithProductIds.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.price,
    }))
  );

  return NextResponse.json({ displayId }, { status: 201 });
}
