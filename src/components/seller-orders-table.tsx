"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/demo-data";
import { SellerOrderStatusSelect } from "@/components/seller-order-status-select";
import type { SellerOrderRow } from "@/lib/seller-data";

type OrderTab = "ALL" | "ORDERED" | "TRANSIT" | "DELIVERED";

export function SellerOrdersTable({ orders }: { orders: SellerOrderRow[] }) {
  const [activeTab, setActiveTab] = useState<OrderTab>("ALL");
  const [search, setSearch] = useState("");

  const orderedCount = orders.filter((o) => o.status === "ORDERED").length;
  const transitCount = orders.filter((o) => o.status === "PROCESSING" || o.status === "SHIPPED").length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;

  const filteredOrders = orders.filter((order) => {
    // Tab filter
    if (activeTab === "ORDERED" && order.status !== "ORDERED") return false;
    if (activeTab === "TRANSIT" && order.status !== "PROCESSING" && order.status !== "SHIPPED") return false;
    if (activeTab === "DELIVERED" && order.status !== "DELIVERED") return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = order.displayId.toLowerCase().includes(q);
      const matchCustomer = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchItem = order.items.some((it) => it.productName.toLowerCase().includes(q));
      return matchId || matchCustomer || matchEmail || matchItem;
    }

    return true;
  });

  return (
    <section className="queue-section" style={{ marginTop: 28 }}>
      <div className="section-header">
        <div>
          <h2>Order Fulfillment</h2>
          <p>Update order delivery status to unlock customer return eligibility and manage fulfillment.</p>
        </div>

        <div className="queue-controls">
          <div className="queue-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search order #, customer, item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter orders"
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="filter-pills" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ALL"}
              className={activeTab === "ALL" ? "active" : ""}
              onClick={() => setActiveTab("ALL")}
            >
              All <span className="pill-count">{orders.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ORDERED"}
              className={activeTab === "ORDERED" ? "active" : ""}
              onClick={() => setActiveTab("ORDERED")}
            >
              New{" "}
              {orderedCount > 0 && <span className="pill-count alert">{orderedCount}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "TRANSIT"}
              className={activeTab === "TRANSIT" ? "active" : ""}
              onClick={() => setActiveTab("TRANSIT")}
            >
              In Transit <span className="pill-count">{transitCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "DELIVERED"}
              className={activeTab === "DELIVERED" ? "active" : ""}
              onClick={() => setActiveTab("DELIVERED")}
            >
              Delivered <span className="pill-count good">{deliveredCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items &amp; Quantities</th>
              <th>Total Amount</th>
              <th>Placed On</th>
              <th>Fulfillment Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <div className="empty-table-state">
                    <span className="empty-icon">🛍️</span>
                    <strong>No orders placed yet</strong>
                    <p>Orders created through the store checkout will appear here immediately for fulfillment.</p>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <div className="empty-table-state">
                    <span className="empty-icon">🔍</span>
                    <strong>No orders match your filter</strong>
                    <p>Try clearing your search query or selecting a different tab.</p>
                    <button
                      type="button"
                      className="button ghost small"
                      onClick={() => {
                        setActiveTab("ALL");
                        setSearch("");
                      }}
                      style={{ marginTop: 8 }}
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="case-row">
                  <td>
                    <div className="case-id-cell">
                      <strong className="order-number-display">#{order.displayId}</strong>
                      <span className="case-meta-line">
                        {order.deliveredAt
                          ? `Delivered ${new Date(order.deliveredAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}`
                          : "In fulfillment pipeline"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <strong className="customer-name">{order.customerName}</strong>
                      <span className="customer-email">{order.customerEmail}</span>
                    </div>
                  </td>
                  <td>
                    <div className="order-items-stack">
                      {order.items.map((it, idx) => (
                        <div key={it.id ?? idx} className="order-item-pill">
                          <span className="qty-tag">{it.quantity}×</span>
                          <span className="item-name">{it.productName}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <strong className="order-total-price">{formatPrice(order.totalAmount)}</strong>
                  </td>
                  <td>
                    <span className="order-date-text">
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
  );
}
