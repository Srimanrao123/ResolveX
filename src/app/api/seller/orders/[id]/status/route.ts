import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/app-auth";

const validStatuses = new Set(["ORDERED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentProfile();
  if (user?.role !== "seller" || user.email !== "srimanrao0707@gmail.com") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { status?: string } | null;
  const newStatus = body?.status?.toUpperCase();

  if (!newStatus || !validStatuses.has(newStatus)) {
    return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  }

  const updateData: { status: string; delivered_at: string | null } = {
    status: newStatus,
    delivered_at: newStatus === "DELIVERED" ? new Date().toISOString() : null,
  };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase.from("orders").update(updateData);
  const { data: updatedOrder, error } = await (
    isUuid ? query.eq("id", id) : query.eq("display_id", id)
  )
    .select("id, display_id, status, delivered_at")
    .maybeSingle();

  if (error || !updatedOrder) {
    console.error("Order status update error:", error);
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: updatedOrder });
}
