import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
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
          // Check if an existing return case exists for this item or order from database
          const existingReturn = returnCases.find(
            (rc) =>
              (order.orderItemId && rc.orderItemId === order.orderItemId) ||
              (rc.orderDisplayId && rc.orderDisplayId === order.id)
          );

          const returnStatus = existingReturn
            ? existingReturn.status.replaceAll("_", " ")
            : null;

          const returnUrl = existingReturn
            ? `/returns/${existingReturn.displayId}`
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
                {order.status === "DELIVERED" ? (
                  <p>
                    Delivered{" "}
                    {order.deliveredAt
                      ? new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Recently"}
                  </p>
                ) : (
                  <p style={{ color: "var(--muted)" }}>
                    Ordered{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Recently"}
                    {" · "}
                    <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                      {order.status === "ORDERED"
                        ? "Order confirmed"
                        : order.status === "PROCESSING"
                        ? "Processing at warehouse"
                        : order.status === "SHIPPED"
                        ? "Out for delivery"
                        : order.status}
                    </span>
                  </p>
                )}
              </div>
              <div className="order-action">
                <strong>{formatPrice(order.price)}</strong>
                {existingReturn ? (
                  <span
                    className={`status ${
                      existingReturn.status === "APPROVED" || existingReturn.status === "COMPLETED" || existingReturn.status === "REFUNDED"
                        ? "good"
                        : existingReturn.status === "REJECTED"
                        ? "bad"
                        : "warm"
                    }`}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                  >
                    Return: {returnStatus}
                  </span>
                ) : order.status === "DELIVERED" ? (
                  <span className="status delivered">Delivered</span>
                ) : order.status === "SHIPPED" ? (
                  <span className="status warm">Shipped</span>
                ) : order.status === "PROCESSING" ? (
                  <span className="status warm">Processing</span>
                ) : (
                  <span className="status" style={{ background: "var(--paper-2)", color: "var(--ink)", borderColor: "var(--line)" }}>Ordered</span>
                )}

                {/* "Need Help?" section */}
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
                    ) : order.status === "DELIVERED" ? (
                      <Link className="help-menu-item" href={returnUrl}>
                        <strong>I want to return or exchange →</strong>
                        <small>14-day hassle-free resolution</small>
                      </Link>
                    ) : (
                      <div className="help-menu-item" style={{ cursor: "default" }}>
                        <strong>Package in transit ({order.status})</strong>
                        <small>Returns & exchanges unlock once item is delivered.</small>
                      </div>
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
