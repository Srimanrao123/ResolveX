import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import { ensureDatabaseSeeded } from "@/lib/db-seed";
import type { DemoOrder } from "@/lib/types";

type DbOrder = {
  id: string;
  display_id: string;
  delivered_at: string | null;
  created_at: string;
  status: DemoOrder["status"];
  order_items: {
    id: string;
    unit_price: number;
    quantity: number;
    product: { name: string; image_url: string | null } | null;
  }[];
};

export async function getCustomerOrders(): Promise<{ orders: DemoOrder[]; isDemo: boolean }> {
  const supabase = getSupabaseAdminClient();
  const user = await getCurrentProfile();
  if (!supabase || !user || user.role !== "customer") return { orders: [], isDemo: false };

  let { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      display_id,
      status,
      delivered_at,
      created_at,
      order_items (
        id,
        unit_price,
        quantity,
        product:products ( name, image_url )
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (!error && (!data || data.length === 0)) {
    // Seed real orders in DB for this customer so they have real records
    await ensureDatabaseSeeded(user.id);
    const retry = await supabase
      .from("orders")
      .select(`
        id,
        display_id,
        status,
        delivered_at,
        created_at,
        order_items (
          id,
          unit_price,
          quantity,
          product:products ( name, image_url )
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error || !data?.length) return { orders: [], isDemo: false };

  const dbOrders = data as unknown as DbOrder[];
  const orders: DemoOrder[] = [];

  for (const o of dbOrders) {
    for (const item of o.order_items ?? []) {
      if (!item.product) continue;
      orders.push({
        id: o.display_id,
        orderDbId: o.id,
        orderItemId: item.id,
        product: item.product.name,
        price: Number(item.unit_price),
        deliveredAt: o.delivered_at,
        createdAt: o.created_at,
        image: item.product.image_url ?? "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop",
        status: o.status,
      });
    }
  }

  return { orders, isDemo: false };
}
