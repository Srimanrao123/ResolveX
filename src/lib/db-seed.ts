import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { products as catalogProducts } from "@/lib/products";

export async function ensureDatabaseSeeded(customerProfileId?: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  try {
    // 1. Ensure Store exists
    let storeId: string;
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("name", "ResolveX Store")
      .maybeSingle();

    if (store) {
      storeId = store.id;
    } else {
      const { data: newStore, error: storeError } = await supabase
        .from("stores")
        .insert({
          name: "ResolveX Store",
          return_window_days: 30,
          auto_approval_limit: 5000,
        })
        .select("id")
        .single();
      if (storeError || !newStore) throw storeError;
      storeId = newStore.id;
    }

    // 2. Ensure Seller member linked to Store
    const { data: sellerProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "srimanrao0707@gmail.com")
      .maybeSingle();

    if (sellerProfile) {
      await supabase.from("store_members").upsert(
        { store_id: storeId, profile_id: sellerProfile.id, role: "seller" },
        { onConflict: "store_id,profile_id" }
      );
    }

    // 3. Ensure Products exist in database
    for (const p of catalogProducts) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("name", p.name)
        .eq("store_id", storeId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("products").insert({
          store_id: storeId,
          name: p.name,
          category: p.category,
          price: p.price,
          image_url: p.image,
          is_final_sale: p.id === "classic-denim-jacket" ? false : false,
        });
      }
    }

    // 4. If a customer is logged in, ensure they have initial delivered orders and cases
    if (customerProfileId) {
      await seedCustomerOrdersAndCases(supabase, storeId, customerProfileId);
    }

    return true;
  } catch (err) {
    console.error("ensureDatabaseSeeded error:", err);
    return false;
  }
}

async function seedCustomerOrdersAndCases(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  storeId: string,
  customerId: string
) {
  // Check if customer already has orders
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_id", customerId)
    .limit(1);

  if (existingOrders && existingOrders.length > 0) {
    return; // Customer already has orders
  }

  // Fetch product IDs
  const { data: dbProducts } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("store_id", storeId);

  if (!dbProducts || dbProducts.length === 0) return;

  const shoes = dbProducts.find((p) => p.name.includes("Sneaker") || p.name.includes("Shoes")) ?? dbProducts[0];
  const tshirt = dbProducts.find((p) => p.name.includes("T-Shirt") || p.name.includes("Tee")) ?? dbProducts[1] ?? dbProducts[0];
  const jacket = dbProducts.find((p) => p.name.includes("Jacket") || p.name.includes("Shirt")) ?? dbProducts[2] ?? dbProducts[0];

  const now = new Date();

  // Create Order 1: Shoes (Delivered 10 days ago) - Order ID: TH10293
  const order1Date = new Date(now.getTime() - 10 * 86400000);
  const { data: order1 } = await supabase
    .from("orders")
    .insert({
      display_id: "TH10293",
      store_id: storeId,
      customer_id: customerId,
      status: "DELIVERED",
      delivered_at: order1Date.toISOString(),
      created_at: new Date(order1Date.getTime() - 2 * 86400000).toISOString(),
    })
    .select("id")
    .single();

  if (order1) {
    const { data: item1 } = await supabase
      .from("order_items")
      .insert({
        order_id: order1.id,
        product_id: shoes.id,
        quantity: 1,
        unit_price: shoes.price,
      })
      .select("id")
      .single();

    // Create realistic Return Case RET-2048 for this shoe order in Supabase
    if (item1) {
      const { data: case1 } = await supabase
        .from("return_cases")
        .insert({
          display_id: "RET-2048",
          order_item_id: item1.id,
          customer_id: customerId,
          requested_resolution: "refund",
          customer_message: "The sole began detaching and peeling from the front after two days of wearing.",
          reason: "DAMAGED",
          outcome: "SELLER_REVIEW",
          status: "UNDER_REVIEW",
          risk_level: "HIGH",
          policy_result: "Within 30-day window",
          ai_summary: "Customer reports sole detachment on Velocity Runner Sneakers. Manual review recommended due to repeated damage claims.",
          evidence_assessment: "Image evidence evaluated. Requires seller review.",
        })
        .select("id")
        .single();

      if (case1) {
        await supabase.from("return_events").insert([
          {
            return_case_id: case1.id,
            status: "REQUESTED",
            message: "Return request submitted by customer with damage photos.",
          },
          {
            return_case_id: case1.id,
            status: "UNDER_REVIEW",
            message: "Sent for seller review. AI flag: high risk, repeated claim.",
          },
        ]);
      }
    }
  }

  // Create Order 2: T-Shirt (Delivered 5 days ago) - Order ID: TH10284
  const order2Date = new Date(now.getTime() - 5 * 86400000);
  const { data: order2 } = await supabase
    .from("orders")
    .insert({
      display_id: "TH10284",
      store_id: storeId,
      customer_id: customerId,
      status: "DELIVERED",
      delivered_at: order2Date.toISOString(),
      created_at: new Date(order2Date.getTime() - 2 * 86400000).toISOString(),
    })
    .select("id")
    .single();

  if (order2) {
    await supabase.from("order_items").insert({
      order_id: order2.id,
      product_id: tshirt.id,
      quantity: 1,
      unit_price: tshirt.price,
    });
  }

  // Create Order 3: Jacket (Delivered 2 days ago) - Order ID: TH10071
  const order3Date = new Date(now.getTime() - 2 * 86400000);
  const { data: order3 } = await supabase
    .from("orders")
    .insert({
      display_id: "TH10071",
      store_id: storeId,
      customer_id: customerId,
      status: "DELIVERED",
      delivered_at: order3Date.toISOString(),
      created_at: new Date(order3Date.getTime() - 2 * 86400000).toISOString(),
    })
    .select("id")
    .single();

  if (order3) {
    await supabase.from("order_items").insert({
      order_id: order3.id,
      product_id: jacket.id,
      quantity: 1,
      unit_price: jacket.price,
    });
  }
}
