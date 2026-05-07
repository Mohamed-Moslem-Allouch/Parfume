"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_KEY = "attar-luxe-cart";

export type CartProduct = {
  id: string;
  variantId: string;
  variantName: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
  type: string;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  addItem: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  removeItem: (cartKey: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function getCartKey(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CART_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed.filter((item) => item.variantId && item.variantName));
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

    return {
      items,
      itemCount,
      subtotal,
      isOpen,
      addItem(product, quantity = 1) {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id && item.variantId === product.variantId);

          if (existing) {
            return current.map((item) =>
              item.id === product.id && item.variantId === product.variantId
                ? {
                    ...item,
                    quantity: Math.min(product.stock, item.quantity + quantity)
                  }
                : item
            );
          }

          return [
            ...current,
            {
              ...product,
              quantity: Math.min(product.stock, quantity)
            }
          ];
        });
        setIsOpen(true);
      },
      updateQuantity(cartKey, quantity) {
        setItems((current) =>
          current
            .map((item) =>
              getCartKey(item.id, item.variantId) === cartKey
                ? {
                    ...item,
                    quantity: Math.min(item.stock, Math.max(1, quantity))
                  }
                : item
            )
            .filter((item) => item.quantity > 0)
        );
      },
      removeItem(cartKey) {
        setItems((current) => current.filter((item) => getCartKey(item.id, item.variantId) !== cartKey));
      },
      clearCart() {
        setItems([]);
      },
      openCart() {
        setIsOpen(true);
      },
      closeCart() {
        setIsOpen(false);
      }
    };
  }, [isOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
