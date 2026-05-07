"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { SerializedProduct } from "@/lib/mappers";
import { formatCurrency } from "@/lib/format";

export function ProductCard({ product }: { product: SerializedProduct }) {
  const image = product.images[0] || "/products/royal-saffron-oud.svg";
  const defaultVariant = product.variants.find((variant) => variant.isDefault) || product.variants[0];
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const showNew = product.isNew;
  const showBestSeller = product.bestSeller;

  return (
    <motion.article
      transition={{ duration: 0.2 }}
      className="product-card-glass group"
    >
      <Link href={`/products/${product.slug}`} style={{ backgroundColor: 'var(--bg-secondary)' }} className="relative block aspect-square overflow-hidden rounded-[1.5rem]">
        <Image src={image} alt={product.name} fill className="object-cover transition duration-700 group-hover:scale-110" sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {showNew && <span className="badge-new absolute left-3 top-3">NEW</span>}
        {showBestSeller && <span className="badge-bestseller absolute right-3 top-3">BEST SELLER</span>}
        {totalStock <= 0 && <span className="badge-soldout absolute bottom-3 left-3">Sold out</span>}
      </Link>
      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-[9px] uppercase tracking-[0.14em] text-gold sm:text-[10px]">{product.category.name}</p>
        <Link href={`/products/${product.slug}`} style={{ color: 'var(--text-heading)' }} className="mt-1 block font-heading text-sm leading-snug transition hover:text-gold">
          {product.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-gold">From {formatCurrency(product.price)}</p>
          {product.offer?.active && product.originalPrice > product.price ? (
            <p className="text-[11px] text-muted line-through">{formatCurrency(product.originalPrice)}</p>
          ) : null}
        </div>
        <div className="mt-auto pt-2">
          {defaultVariant ? (
            <AddToCartButton
              product={{
                id: product.id,
                variantId: defaultVariant.id,
                variantName: defaultVariant.name,
                name: product.name,
                slug: product.slug,
                price: defaultVariant.price,
                image,
                stock: defaultVariant.stock,
                type: product.type
              }}
              className="btn-secondary min-h-9 w-full px-2 text-[11px] sm:min-h-10 sm:px-3 sm:text-xs"
            />
          ) : (
            <button type="button" disabled className="btn-secondary min-h-9 w-full px-2 text-[11px] sm:min-h-10 sm:px-3 sm:text-xs">
              No Options
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
