import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import { getCustomerOrders } from "@/lib/orders";
import { requireCustomer } from "@/lib/route-guards";

export default async function OrdersPage() {
  await requireCustomer();
  const { orders, isDemo } = await getCustomerOrders();

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THREAD &amp; HUE · ORDERS</p>
          <h1>My orders</h1>
          <p>Delivered orders eligible for returns, exchanges, or re-ordering.</p>
        </div>
      </div>

      <div className="order-list">
        {orders.map((order) => (
          <article className="order-card" key={order.orderItemId ?? order.id}>
            <div className="product-art">
              {order.image.startsWith("http") ? (
                <img src={order.image} alt={order.product} className="product-image-cover" />
              ) : (
                order.image
              )}
            </div>
            <div className="order-info">
              <p className="order-number">ORDER #{order.id}</p>
              <h2>{order.product}</h2>
              <p>
                Delivered{" "}
                {new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="order-action">
              <strong>{formatPrice(order.price)}</strong>
              <span className="status delivered">Delivered</span>
              <Link
                className="text-link"
                href={`/returns/new?order=${order.id}${order.orderItemId ? `&item=${order.orderItemId}` : ""}`}
              >
                Start a return →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
