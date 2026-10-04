import Link from "next/link";
import { requireSeller } from "@/lib/route-guards";
import { getSellerOrders } from "@/lib/seller-data";
import { SellerOrdersTable } from "@/components/seller-orders-table";

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

      <SellerOrdersTable orders={orders} />
    </div>
  );
}
