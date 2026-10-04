"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/demo-data";
import type { ReturnCase } from "@/lib/types";

type FilterTab = "ALL" | "REVIEW" | "HIGH_RISK";

export function SellerQueueTable({ cases }: { cases: ReturnCase[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [search, setSearch] = useState("");

  const reviewCount = cases.filter(
    (c) => c.status === "Needs review" || c.status === "More info"
  ).length;
  const highRiskCount = cases.filter((c) => c.risk === "HIGH").length;

  const filteredCases = cases.filter((item) => {
    // Tab filter
    if (activeTab === "REVIEW" && item.status !== "Needs review" && item.status !== "More info") {
      return false;
    }
    if (activeTab === "HIGH_RISK" && item.risk !== "HIGH") {
      return false;
    }

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = item.id.toLowerCase().includes(q);
      const matchCustomer = item.customer.toLowerCase().includes(q);
      const matchProduct = item.product.toLowerCase().includes(q);
      const matchReason = item.reason.toLowerCase().includes(q);
      const matchOrder = item.orderId.toLowerCase().includes(q);
      return matchId || matchCustomer || matchProduct || matchReason || matchOrder;
    }

    return true;
  });

  return (
    <section className="queue-section">
      <div className="section-header">
        <div>
          <h2>Return queue</h2>
          <p>Prioritized cases requiring merchant investigation or automated oversight.</p>
        </div>

        <div className="queue-controls">
          <div className="queue-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search case, customer, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter return cases"
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
              All <span className="pill-count">{cases.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "REVIEW"}
              className={activeTab === "REVIEW" ? "active" : ""}
              onClick={() => setActiveTab("REVIEW")}
            >
              Needs review{" "}
              {reviewCount > 0 && <span className="pill-count alert">{reviewCount}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "HIGH_RISK"}
              className={activeTab === "HIGH_RISK" ? "active" : ""}
              onClick={() => setActiveTab("HIGH_RISK")}
            >
              High risk{" "}
              {highRiskCount > 0 && <span className="pill-count high-risk">{highRiskCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Return Case</th>
              <th>Customer</th>
              <th>Reason</th>
              <th>Risk Tier</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cases.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <div className="empty-table-state">
                    <span className="empty-icon">📦</span>
                    <strong>No return cases recorded yet</strong>
                    <p>When customers initiate a return or exchange, cases will appear here in real time.</p>
                  </div>
                </td>
              </tr>
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-table-cell">
                  <div className="empty-table-state">
                    <span className="empty-icon">🔍</span>
                    <strong>No cases match your filters</strong>
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
              filteredCases.map((item) => (
                <tr key={item.id} className="case-row">
                  <td>
                    <div className="case-id-cell">
                      <span className="case-id-tag">{item.id}</span>
                      <strong className="case-product-name">{item.product}</strong>
                      <span className="case-meta-line">
                        Order #{item.orderId} · {formatPrice(item.amount)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <span className="customer-name">{item.customer}</span>
                      <span className="customer-sub">{item.policy}</span>
                    </div>
                  </td>
                  <td>
                    <span className="reason-tag">{item.reason}</span>
                  </td>
                  <td>
                    <span className={`risk-badge ${item.risk.toLowerCase()}`}>
                      <span className="risk-dot" />
                      {item.risk} RISK
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        item.status === "Approved"
                          ? "good"
                          : item.status === "Needs review"
                          ? "review"
                          : item.status === "More info"
                          ? "info"
                          : item.status === "Not eligible"
                          ? "bad"
                          : item.status === "Returning" || item.status === "Received"
                          ? "transit"
                          : item.status === "Refunded"
                          ? "good"
                          : "neutral"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link className="table-action-link" href={`/seller/returns/${item.id}`}>
                      <span>Review</span>
                      <span className="action-arrow">→</span>
                    </Link>
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
