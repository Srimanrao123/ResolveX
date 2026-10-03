"use client";

export function PrintReturnLabelButton({
  displayId,
  productName,
  orderId,
}: {
  displayId: string;
  productName?: string;
  orderId?: string;
}) {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="button primary"
      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
      title="Print return shipping label and packing slip"
    >
      <span>📄</span>
      <span>Print Return Label & Slip</span>
    </button>
  );
}
