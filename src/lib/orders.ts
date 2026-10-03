import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";
import { ensureDatabaseSeeded } from "@/lib/db-seed";
import type { DemoOrder } from "@/lib/types";

type OrderItemResult = {
  id: string;
  unit_price: number;
  product: { name: string; image_url: string | null } | null;
  order: { display_id: string; delivered_at: string | null; status: "DELIVERED" | "PROCESSING" } | null;
};

export async function getCustomerOrders(): Promise<{ orders: DemoOrder[]; isDemo: boolean }> {
  const supabase = getSupabaseAdminClient();
  const user = await getCurrentProfile();
  if (!supabase || !user || user.role !== "customer") return { orders: [], isDemo: false };

  let { data, error } = await supabase
    .from("order_items")
    .select("id, unit_price, product:products(name, image_url), order:orders!inner(display_id, delivered_at, status)")
    .eq("orders.customer_id", user.id)
    .order("created_at", { ascending: false });

  if (!error && (!data || data.length === 0)) {
    // Seed real orders in DB for this customer so they have real records
    await ensureDatabaseSeeded(user.id);
    const retry = await supabase
      .from("order_items")
      .select("id, unit_price, product:products(name, image_url), order:orders!inner(display_id, delivered_at, status)")
      .eq("orders.customer_id", user.id)
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error || !data?.length) return { orders: [], isDemo: false };

  const orders = (data as unknown as OrderItemResult[]).flatMap((item) => {
    if (!item.order?.delivered_at || !item.product) return [];
    return [{
      id: item.order.display_id,
      orderItemId: item.id,
      product: item.product.name,
      price: Number(item.unit_price),
      deliveredAt: item.order.delivered_at,
      image: item.product.image_url ?? "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=400&auto=format&fit=crop",
      status: item.order.status,
    }];
  });

  return { orders, isDemo: false };
}
