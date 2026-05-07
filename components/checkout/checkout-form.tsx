"use client";

import { MapPin, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/format";
import { StoreMap } from "@/components/store-map";

type StoreInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  deliveryFee: number;
};

export function CheckoutForm({ store }: { store: StoreInfo }) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [deliveryMethod, setDeliveryMethod] = useState<"HOME_DELIVERY" | "STORE_PICKUP">("HOME_DELIVERY");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const itemPayload = useMemo(() => items.map((item) => ({ productId: item.id, variantId: item.variantId, quantity: item.quantity })), [items]);
  const deliveryFee = deliveryMethod === "HOME_DELIVERY" ? store.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      customerName: String(formData.get("customerName") || ""),
      customerEmail: String(formData.get("customerEmail") || ""),
      customerPhone: String(formData.get("customerPhone") || ""),
      deliveryMethod,
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || ""),
      zip: String(formData.get("zip") || ""),
      notes: String(formData.get("notes") || ""),
      items: itemPayload
    };

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as { orderNumber?: string; message?: string };

      if (!response.ok || !data.orderNumber) {
        throw new Error(data.message || "Unable to place order.");
      }

      clearCart();
      router.push(`/thank-you/${data.orderNumber}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to place order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="grid gap-6">
        <section className="rounded-md border border-white/10 bg-obsidian p-5 sm:p-6">
          <h2 className="font-heading text-2xl text-mist">Customer Information</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Name</span>
              <input name="customerName" className="input-field" required minLength={2} />
            </label>
            <label>
              <span className="label">Email</span>
              <input name="customerEmail" type="email" className="input-field" required />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Phone</span>
              <input name="customerPhone" className="input-field" required minLength={6} />
            </label>
          </div>
        </section>

        <section className="rounded-md border border-white/10 bg-obsidian p-5 sm:p-6">
          <h2 className="font-heading text-2xl text-mist">Delivery Option</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="cursor-pointer rounded-md border border-white/10 bg-midnight p-4 transition has-[:checked]:border-gold has-[:checked]:shadow-gold">
              <input
                type="radio"
                name="deliveryMethod"
                value="HOME_DELIVERY"
                checked={deliveryMethod === "HOME_DELIVERY"}
                onChange={() => setDeliveryMethod("HOME_DELIVERY")}
                className="sr-only"
              />
              <span className="flex items-center gap-3 font-medium text-mist">
                <MapPin className="h-5 w-5 text-gold" />
                Home Delivery
              </span>
              <span className="mt-2 block text-sm text-muted">Send the order to your address.</span>
            </label>
            <label className="cursor-pointer rounded-md border border-white/10 bg-midnight p-4 transition has-[:checked]:border-gold has-[:checked]:shadow-gold">
              <input
                type="radio"
                name="deliveryMethod"
                value="STORE_PICKUP"
                checked={deliveryMethod === "STORE_PICKUP"}
                onChange={() => setDeliveryMethod("STORE_PICKUP")}
                className="sr-only"
              />
              <span className="flex items-center gap-3 font-medium text-mist">
                <Store className="h-5 w-5 text-gold" />
                Pick up from Store
              </span>
              <span className="mt-2 block text-sm text-muted">Collect from our perfume boutique.</span>
            </label>
          </div>



          {deliveryMethod === "HOME_DELIVERY" ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label">Address</span>
                <input name="address" className="input-field" required={deliveryMethod === "HOME_DELIVERY"} />
              </label>
              <label>
                <span className="label">City</span>
                <input name="city" className="input-field" required={deliveryMethod === "HOME_DELIVERY"} />
              </label>
              <label>
                <span className="label">ZIP / Postcode</span>
                <input name="zip" className="input-field" />
              </label>
              <label className="sm:col-span-2">
                <span className="label">Additional notes</span>
                <textarea name="notes" rows={4} className="input-field resize-none" placeholder="Apartment, floor, landmark, etc." />
              </label>
            </div>
          ) : (
            <div className="mt-6 grid gap-6">
              <div className="rounded-md border border-gold/25 bg-midnight p-5">
                <p className="font-heading text-lg text-gold">{store.name}</p>
                <p className="mt-1 text-sm text-muted">{store.address}</p>
                <div className="mt-4 h-64 overflow-hidden rounded-md border border-white/10 grayscale-[0.8] hover:grayscale-0 transition-all duration-700">
                  <StoreMap />
                </div>
              </div>
              <label>
                <span className="label">Additional notes</span>
                <textarea 
                  name="notes" 
                  rows={3} 
                  className="input-field resize-none" 
                  placeholder="Expected pickup time or who will collect the order..." 
                />
              </label>
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-md border border-gold/25 bg-obsidian p-5 sm:p-6">
        <h2 className="font-heading text-2xl text-mist">Order Summary</h2>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 text-sm">
              <div>
                <p className="font-medium text-mist">{item.name}</p>
                <p className="mt-1 text-muted">
                  {item.variantName !== "Standard" && <span>{item.variantName} &bull; </span>}
                  Qty {item.quantity}
                </p>
              </div>
              <p className="font-bold text-gold">{formatCurrency(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="text-mist">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Delivery</span>
            <span className="text-mist">{formatCurrency(deliveryFee)}</span>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-gold">{formatCurrency(total)}</span>
        </div>
        {error ? <p className="mt-4 rounded-md border border-red-400/30 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
        <button type="submit" disabled={loading || !items.length} className="btn-primary mt-6 w-full">
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </aside>
    </form>
  );
}
