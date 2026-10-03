import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/app-auth";
import { EcommerceHome } from "@/components/ecommerce-home";
import { getCustomerOrders } from "@/lib/orders";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  // If a seller is logged in, redirect directly to the seller portal
  if (profile?.role === "seller") {
    redirect("/seller");
  }

  // Fetch orders for customer if logged in
  let recentOrders: any[] = [];
  let isDemo = false;
  if (profile?.role === "customer") {
    const ordersData = await getCustomerOrders();
    recentOrders = ordersData.orders;
    isDemo = ordersData.isDemo;
  }

  return (
    <EcommerceHome
      profile={profile}
      recentOrders={recentOrders}
      isDemo={isDemo}
    />
  );
}
