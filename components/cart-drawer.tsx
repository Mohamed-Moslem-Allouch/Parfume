"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { getCartKey, useCart } from "@/components/providers/cart-provider";

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, removeItem, updateQuantity } = useCart();

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
            aria-label="Close cart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            className="fixed right-0 top-0 z-[80] flex h-dvh w-full max-w-md flex-col border-l border-gold/25 bg-obsidian shadow-gold-strong"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 240, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <h2 className="font-heading text-xl text-mist">Your Cart</h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-muted transition hover:text-mist"
                aria-label="Close cart"
                title="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <div className="grid min-h-[300px] place-items-center text-center">
                  <div>
                    <ShoppingBag className="mx-auto h-10 w-10 text-gold" />
                    <p className="mt-4 font-heading text-xl text-mist">Your cart is empty</p>
                    <p className="mt-2 text-sm text-muted">Add a product and it will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={getCartKey(item.id, item.variantId)} className="grid grid-cols-[84px_1fr] gap-4 rounded-lg border border-white/10 bg-midnight p-3">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-charcoal">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="84px" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/products/${item.slug}`} onClick={closeCart} className="font-medium text-mist hover:text-gold">
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted">{formatCurrency(item.price)}</p>
                        {item.type === "PERFUME" && 
                         item.variantName !== "Standard" && 
                         !item.variantName.toLowerCase().includes("default") && (
                          <p className="mt-1 text-xs font-bold text-gold/80">{item.variantName}</p>
                        )}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex h-9 items-center rounded-lg border border-white/10">
                            <button
                              type="button"
                              onClick={() => updateQuantity(getCartKey(item.id, item.variantId), item.quantity - 1)}
                              className="grid h-9 w-9 place-items-center text-muted hover:text-mist"
                              aria-label="Decrease quantity"
                              title="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-9 text-center text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(getCartKey(item.id, item.variantId), item.quantity + 1)}
                              className="grid h-9 w-9 place-items-center text-muted hover:text-mist"
                              aria-label="Increase quantity"
                              title="Increase quantity"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(getCartKey(item.id, item.variantId))}
                            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white/5 hover:text-red-300"
                            aria-label="Remove item"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-5">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted">Subtotal</span>
                <span className="text-lg font-bold text-gold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="grid gap-3">
                <Link href="/checkout" onClick={closeCart} className="btn-primary">
                  Proceed to Checkout
                </Link>
                <Link href="/cart" onClick={closeCart} className="btn-secondary">
                  View Cart
                </Link>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
