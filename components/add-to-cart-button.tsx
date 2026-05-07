"use client";

import { ShoppingBag } from "lucide-react";
import { CartProduct, useCart } from "@/components/providers/cart-provider";

export function AddToCartButton({
  product,
  quantity = 1,
  className = "btn-primary"
}: {
  product: CartProduct;
  quantity?: number;
  className?: string;
}) {
  const { addItem } = useCart();
  const disabled = product.stock <= 0 || !product.variantId;

  return (
    <button type="button" disabled={disabled} onClick={() => addItem(product, quantity)} className={className}>
      <ShoppingBag className="h-4 w-4" />
      {disabled ? "Out of Stock" : "Add to Cart"}
    </button>
  );
}
