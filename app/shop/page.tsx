import type { Metadata } from "next";
import { ShopProductBrowser } from "@/components/shop-product-browser";

export const metadata: Metadata = {
  title: "Shop"
};

export default function ShopPage() {
  return (
    <div className="section-shell py-12">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Shop</p>
        <h1 className="mt-3 font-heading text-4xl text-mist md:text-6xl">Our full collection</h1>
        <p className="mt-4 text-muted">
          Search our collection, filter by category, and sort by price.
        </p>
      </div>
      <ShopProductBrowser />
    </div>
  );
}
