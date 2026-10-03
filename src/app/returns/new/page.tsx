import { ReturnChat } from "@/components/return-chat";
import { demoOrders } from "@/lib/demo-data";
import { getCustomerOrders } from "@/lib/orders";
import { requireCustomer } from "@/lib/route-guards";

export default async function NewReturnPage({ searchParams }: { searchParams: Promise<{ order?: string; item?: string }> }) {
  await requireCustomer();
  const { order: orderId, item: itemId } = await searchParams;
  const { orders } = await getCustomerOrders();
  const order = orders.find(item => item.orderItemId === itemId || item.id === orderId) ?? demoOrders[0];
  return (
    <div className="page-shell narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RETURNGUARD AI</p>
          <h1>Start your return</h1>
          <p>Our AI agent will investigate and resolve your request.</p>
        </div>
      </div>
      <ReturnChat order={order} />
    </div>
  );
}
