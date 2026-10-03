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
      title="Print return packing checklist"
    >
      <span>📄</span>
      <span>Print packing checklist</span>
    </button>
  );
}
