import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { storeConfig } from "@/lib/store";

export const metadata: Metadata = {
  title: "Checkout"
};

export default function CheckoutPage() {
  return (
    <div className="section-shell py-12">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Checkout</p>
        <h1 className="mt-3 font-heading text-4xl text-mist md:text-6xl">Create your order</h1>
        <p className="mt-4 text-muted">No online payment is taken here. We create the order and email the details.</p>
      </div>
      <CheckoutForm store={storeConfig} />
    </div>
  );
}
