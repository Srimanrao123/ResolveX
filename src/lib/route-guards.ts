import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/app-auth";

export async function requireCustomer() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "customer") redirect("/seller");
  return profile;
}

export async function requireSeller() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "seller" || profile.email !== "srimanrao0707@gmail.com") redirect("/orders");
  return profile;
}
