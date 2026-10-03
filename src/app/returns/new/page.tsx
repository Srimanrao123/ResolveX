import Link from "next/link";
import { redirect } from "next/navigation";
import { ReturnChat } from "@/components/return-chat";
import { getCustomerOrders } from "@/lib/orders";
import { requireCustomer } from "@/lib/route-guards";
import { getCustomerReturnForOrder } from "@/lib/customer-returns";

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; item?: string }>;
}) {
  await requireCustomer();
  const { order: orderId, item: itemId } = await searchParams;
  const { orders } = await getCustomerOrders();

  const order =
    (itemId ? orders.find((item) => item.orderItemId === itemId) : null) ??
    (orderId ? orders.find((item) => item.id === orderId) : null) ??
    orders[0];

  if (!order) {
    redirect("/orders");
  }

  // If order is not delivered yet, tell customer to wait until delivery
  if (order.status !== "DELIVERED") {
    return (
      <div className="page-shell narrow status-page">
        <p className="eyebrow">ORDER IN TRANSIT</p>
        <div className="result-icon warm">🚚</div>
        <p className="status-label warm">{order.status}</p>
        <h1>Order not delivered yet</h1>
        <p className="lead">
          Order #{order.id} for {order.product} is currently {order.status.toLowerCase()}.
          Returns and exchanges can be initiated once the package has been delivered.
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/orders" className="button ghost">← Back to my orders</Link>
        </div>
      </div>
    );
  }

  // Check if a return was already initiated for this order/item:
  // If so, continue from that particular status rather than restarting from the beginning!
  const existingReturn = await getCustomerReturnForOrder(order.id, order.orderItemId);
  if (existingReturn?.display_id) {
    redirect(`/returns/${existingReturn.display_id}`);
  }

  const uniqueKey = `${order.orderItemId ?? order.id}-${order.product}`;

  return (
    <div className="page-shell narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CUSTOMER SUPPORT · RETURNS</p>
          <h1>Return or Exchange</h1>
          <p>We make returns and exchanges effortless on all eligible purchases.</p>
        </div>
      </div>
      <ReturnChat key={uniqueKey} order={order} />
    </div>
  );
}
