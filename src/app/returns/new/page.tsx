import { ReturnChat } from "@/components/return-chat";
import { demoOrders } from "@/lib/demo-data";
import { getCustomerOrders } from "@/lib/orders";
import { requireCustomer } from "@/lib/route-guards";

export default async function NewReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; item?: string }>;
}) {
  await requireCustomer();
  const { order: orderId, item: itemId } = await searchParams;
  const { orders } = await getCustomerOrders();

  // Combine user's orders and demo orders for comprehensive lookup
  const allAvailableOrders = [...orders, ...demoOrders];

  // 1. If itemId is specified, prioritize exact orderItemId match
  // 2. Otherwise match by orderId
  // 3. Fallback to first available order
  const order =
    (itemId ? allAvailableOrders.find((item) => item.orderItemId === itemId) : null) ??
    (orderId ? allAvailableOrders.find((item) => item.id === orderId) : null) ??
    orders[0] ??
    demoOrders[0];

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
