import Link from "next/link";
import { requireSeller } from "@/lib/route-guards";
import { getSellerOrders } from "@/lib/seller-data";
import { formatPrice } from "@/lib/demo-data";
import { SellerOrderStatusSelect } from "@/components/seller-order-status-select";

export default async function SellerOrdersPage() {
  await requireSeller();
  const orders = await getSellerOrders();

  const orderedCount = orders.filter((o) => o.status === "ORDERED").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;
  const shippedCount = orders.filter((o) => o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  return (
    <div className="page-shell seller-shell">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SELLER PORTAL · ORDERS</p>
          <h1>Store Orders</h1>
          <p>Manage customer orders and update delivery status to unlock customer return eligibility.</p>
        </div>
        <Link href="/seller" className="button ghost">← Return queue</Link>
      </div>

      <section className="stat-grid">
        <article>
          <p>Total orders</p>
          <strong>{orders.length}</strong>
          <small>All database orders</small>
        </article>
        <article>
          <p>New / Ordered</p>
          <strong style={{ color: orderedCount > 0 ? "var(--ink)" : "var(--muted)" }}>
            {orderedCount}
          </strong>
          <small>Awaiting fulfillment</small>
        </article>
        <article>
          <p>In Transit</p>
          <strong>{processingCount + shippedCount}</strong>
          <small>{shippedCount} shipped · {processingCount} processing</small>
        </article>
        <article>
          <p>Delivered</p>
          <strong className="good-text">{deliveredCount}</strong>
          <small>Return window active</small>
        </article>
      </section>

      <section className="queue-section" style={{ marginTop: 32 }}>
        <div className="section-header">
          <div>
            <h2>Order Fulfillment</h2>
            <p>Change an order to &ldquo;Delivered&rdquo; so the customer can view delivered status and initiate returns.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Ordered On</th>
                <th>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px", color: "var(--muted)" }}>
                    No orders placed yet. Orders created via the shop checkout will appear here immediately.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.displayId}</strong>
                      <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>
                        {order.deliveredAt
                          ? `Delivered ${new Date(order.deliveredAt).toLocaleDateString("en-IN")}`
                          : "Not delivered"}
                      </span>
                    </td>
                    <td>
                      <strong>{order.customerName}</strong>
                      <span style={{ fontSize: 11, color: "var(--muted)", display: "block" }}>
                        {order.customerEmail}
                      </span>
                    </td>
                    <td>
                      {order.items.map((it, idx) => (
                        <div key={it.id ?? idx} style={{ fontSize: 13 }}>
                          {it.quantity}x {it.productName}
                        </div>
                      ))}
                    </td>
                    <td>
                      <strong>{formatPrice(order.totalAmount)}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <SellerOrderStatusSelect
                        orderId={order.displayId}
                        initialStatus={order.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
