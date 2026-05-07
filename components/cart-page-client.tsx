"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getCartKey, useCart } from "@/components/providers/cart-provider";
import { formatCurrency } from "@/lib/format";

export function CartPageClient({ deliveryFee }: { deliveryFee: number }) {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (!items.length) {
    return (
      <div className="section-shell py-16">
        <div className="mx-auto max-w-xl rounded-md border border-white/10 bg-obsidian px-6 py-16 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-gold" />
          <h1 className="mt-5 font-heading text-3xl text-mist">Your cart is empty</h1>
          <p className="mt-3 text-muted">Choose a perfume from the shop and it will wait for you here.</p>
          <Link href="/shop" className="btn-primary mt-8">
            Shop Perfumes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell py-12">
      <h1 className="font-heading text-4xl text-mist md:text-5xl">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={getCartKey(item.id, item.variantId)} className="grid gap-4 rounded-md border border-white/10 bg-obsidian p-4 sm:grid-cols-[120px_1fr_auto]">
              <div className="relative aspect-square overflow-hidden rounded-md bg-charcoal">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="120px" />
              </div>
              <div>
                <Link href={`/products/${item.slug}`} className="font-heading text-2xl text-mist hover:text-gold">
                  {item.name}
                </Link>
                <p className="mt-2 text-sm text-muted">{formatCurrency(item.price)} each</p>
                {item.type === "PERFUME" && item.variantName !== "Standard" && (
                  <p className="mt-1 text-sm text-gold">{item.variantName}</p>
                )}
                <div className="mt-5 flex h-10 w-fit items-center rounded-md border border-white/10">
                  <button
                    type="button"
                    onClick={() => updateQuantity(getCartKey(item.id, item.variantId), item.quantity - 1)}
                    className="grid h-10 w-10 place-items-center text-muted hover:text-mist"
                    aria-label="Decrease quantity"
                    title="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(getCartKey(item.id, item.variantId), item.quantity + 1)}
                    className="grid h-10 w-10 place-items-center text-muted hover:text-mist"
                    aria-label="Increase quantity"
                    title="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                <p className="font-bold text-gold">{formatCurrency(item.price * item.quantity)}</p>
                <button
                  type="button"
                  onClick={() => removeItem(getCartKey(item.id, item.variantId))}
                  className="mt-0 grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-white/5 hover:text-red-300 sm:ml-auto sm:mt-6"
                  aria-label="Remove item"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-md border border-gold/25 bg-obsidian p-6">
          <h2 className="font-heading text-2xl text-mist">Order Summary</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="text-mist">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Home delivery</span>
              <span className="text-mist">{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-gold">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          </div>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
