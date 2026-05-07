"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { SerializedProduct } from "@/lib/mappers";
import { formatCurrency } from "@/lib/format";

export function ProductActions({ product }: { product: SerializedProduct }) {
  const defaultVariant = product.variants.find((variant) => variant.isDefault) || product.variants[0];
  const [variantId, setVariantId] = useState(defaultVariant?.id || "");
  const [quantity, setQuantity] = useState(1);
  const selectedVariant = product.variants.find((variant) => variant.id === variantId) || defaultVariant;
  const disabled = !selectedVariant || selectedVariant.stock <= 0;
  const image = product.images[0] || "/products/royal-saffron-oud.svg";

  return (
    <div className="mt-8 grid gap-5">
      {product.variants.length > 1 && (
        <div>
          <p className="label">Choose size</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {product.variants.map((variant) => (
              <label key={variant.id} className="cursor-pointer rounded-md border border-white/10 bg-obsidian p-4 transition has-[:checked]:border-gold has-[:checked]:shadow-gold">
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variantId === variant.id}
                  onChange={() => {
                    setVariantId(variant.id);
                    setQuantity(1);
                  }}
                  className="sr-only"
                />
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium text-mist">{variant.name}</span>
                  <span className="flex items-center gap-2">
                    {variant.originalPrice > variant.price ? <span className="text-xs text-muted line-through">{formatCurrency(variant.originalPrice)}</span> : null}
                    <span className="font-bold text-gold">{formatCurrency(variant.price)}</span>
                  </span>
                  </span>
                </label>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <div className="flex h-12 items-center justify-between rounded-md border border-white/10 bg-obsidian">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={disabled}
            className="grid h-12 w-12 place-items-center text-muted hover:text-mist disabled:opacity-40"
            aria-label="Decrease quantity"
            title="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="font-bold text-mist">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(selectedVariant?.stock || 1, value + 1))}
            disabled={disabled}
            className="grid h-12 w-12 place-items-center text-muted hover:text-mist disabled:opacity-40"
            aria-label="Increase quantity"
            title="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <AddToCartButton
          product={{
            id: product.id,
            variantId: selectedVariant?.id || "",
            variantName: selectedVariant?.name || "",
            name: product.name,
            slug: product.slug,
            price: selectedVariant?.price || product.price,
            image,
            stock: selectedVariant?.stock || 0,
            type: product.type
          }}
          quantity={quantity}
          className="btn-primary w-full"
        />
      </div>
    </div>
  );
}
