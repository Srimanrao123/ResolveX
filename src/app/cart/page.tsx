import { CartView } from "@/components/cart-view";
import { requireCustomer } from "@/lib/route-guards";

export default async function CartPage() {
  await requireCustomer();
  return (
    <div className="page-shell">
      <CartView />
    </div>
  );
}
