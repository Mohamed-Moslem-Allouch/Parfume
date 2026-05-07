export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELED"] as const;
export const PAYMENT_STATUSES = ["UNPAID", "PAID", "REFUNDED", "CANCELED"] as const;
export const PRODUCT_STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export function humanizeStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
