import type { Category, Order, OrderItem, Page, Product, ProductVariant } from "@prisma/client";
import { toNumber } from "@/lib/format";
import { getOfferPrice, getOfferSummary } from "@/lib/offers";

export type ProductWithCategory = Product & {
  category: Category;
  variants?: ProductVariant[];
  pages?: Pick<Page, "id" | "title" | "slug">[];
};

export function serializeProduct(product: ProductWithCategory) {
  const variants = product.variants || [];
  const productWithOffer = product as Product & {
    status?: string;
    offerType?: string | null;
    offerValue?: number | { toString: () => string } | null;
    offerStart?: Date | null;
    offerEnd?: Date | null;
    visualCategoryId?: string | null;
  };
  const basePrice = toNumber(product.price);
  const salePrice = getOfferPrice(basePrice, productWithOffer);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: salePrice,
    originalPrice: basePrice,
    stock: product.stock,
    status: productWithOffer.status || "ACTIVE",
    visualCategoryId: productWithOffer.visualCategoryId || null,
    offer: getOfferSummary(productWithOffer),
    images: typeof product.images === "string" ? JSON.parse(product.images) : product.images,
    videos: typeof product.videos === "string" ? JSON.parse(product.videos) : product.videos,
    featured: product.featured,
    bestSeller: (product as Product & { bestSeller?: boolean }).bestSeller ?? false,
    isNew: (product as Product & { isNew?: boolean }).isNew ?? false,
    topNotes: typeof product.topNotes === "string" ? JSON.parse(product.topNotes) : product.topNotes,
    heartNotes: typeof product.heartNotes === "string" ? JSON.parse(product.heartNotes) : product.heartNotes,
    baseNotes: typeof product.baseNotes === "string" ? JSON.parse(product.baseNotes) : product.baseNotes,
    accords: typeof product.accords === "string" ? JSON.parse(product.accords) : product.accords,
    type: product.type,
    variants: variants
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: getOfferPrice(toNumber(variant.price), productWithOffer),
        originalPrice: toNumber(variant.price),
        stock: variant.stock,
        isDefault: variant.isDefault
      }))
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.price - b.price),
    pageIds: (product.pages || []).map((page) => page.id),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: (product.category as any).slug || ""
    } as { id: string; name: string; slug: string },
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

export type SerializedProduct = ReturnType<typeof serializeProduct>;

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export function serializeOrder(order: OrderWithItems) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryMethod: order.deliveryMethod,
    address: order.address,
    city: order.city,
    zip: order.zip,
    notes: order.notes,
    subtotal: toNumber(order.subtotal),
    deliveryFee: toNumber(order.deliveryFee),
    total: toNumber(order.total),
    status: order.status,
    paymentMethod: (order as Order & { paymentMethod?: string }).paymentMethod || "PAY_ON_DELIVERY",
    paymentStatus: (order as Order & { paymentStatus?: string }).paymentStatus || "UNPAID",
    paymentReference: (order as Order & { paymentReference?: string | null }).paymentReference || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productVariantId: item.productVariantId,
      productName: item.productName,
      variantName: item.variantName,
      productImage: item.productImage,
      productPrice: toNumber(item.productPrice),
      quantity: item.quantity
    }))
  };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;
