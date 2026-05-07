import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart-page-client";
import { storeConfig } from "@/lib/store";

export const metadata: Metadata = {
  title: "Cart"
};

export default function CartPage() {
  return <CartPageClient deliveryFee={storeConfig.deliveryFee} />;
}
