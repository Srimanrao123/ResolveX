import Link from "next/link";
import { formatPrice, reviewCases } from "@/lib/demo-data";
import { getCustomerOrders } from "@/lib/orders";
import { requireCustomer } from "@/lib/route-guards";
import { getCustomerReturnCases } from "@/lib/customer-returns";

export default async function OrdersPage() {
  await requireCustomer();
  const [{ orders }, returnCases] = await Promise.all([
    getCustomerOrders(),
    getCustomerReturnCases(),
  ]);

  return (
    <div className="page-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">RESOLVEX · MY ORDERS</p>
          <h1>My orders</h1>
          <p>Delivered orders eligible for returns, exchanges, or assistance.</p>
        </div>
      </div>

      <div className="order-list">
        {orders.map((order) => {
          // Check if an existing return case exists for this item or order
          const existingReturn =
            returnCases.find(
              (rc) =>
                (order.orderItemId && rc.orderItemId === order.orderItemId) ||
                (rc.orderDisplayId && rc.orderDisplayId === order.id)
            ) ??
            reviewCases.find((c) => c.orderId === order.id);

          const returnStatus =
            existingReturn && "status" in existingReturn
              ? existingReturn.status.replaceAll("_", " ")
              : null;

          const returnUrl = existingReturn
            ? `/returns/${"displayId" in existingReturn ? existingReturn.displayId : existingReturn.id}`
            : `/returns/new?order=${order.id}${order.orderItemId ? `&item=${order.orderItemId}` : ""}`;

          return (
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
                {existingReturn ? (
                  <span className="status warm" style={{ fontSize: 12, padding: "4px 10px" }}>
                    Return: {returnStatus}
                  </span>
                ) : (
                  <span className="status delivered">Delivered</span>
                )}

                {/* "Need Help?" section replacing direct "starter" button */}
                <details className="help-details">
                  <summary className="help-summary-btn">
                    <span>Help</span>
                    <span className="help-caret">▾</span>
                  </summary>
                  <div className="help-menu-content">
                    {existingReturn ? (
                      <Link className="help-menu-item" href={returnUrl}>
                        <strong>I want to view return status →</strong>
                        <small>Current status: {returnStatus}</small>
                      </Link>
                    ) : (
                      <Link className="help-menu-item" href={returnUrl}>
                        <strong>I want to return or exchange →</strong>
                        <small>14-day hassle-free resolution</small>
                      </Link>
                    )}
                  </div>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
