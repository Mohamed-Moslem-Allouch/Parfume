import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES, PRODUCT_STATUSES } from "@/lib/status";

export function sanitizeText(value: string) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
}

const text = (min = 1, max = 255) =>
  z
    .string()
    .min(min)
    .max(max)
    .transform((value) => sanitizeText(value));

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

export const checkoutSchema = z
  .object({
    customerName: text(2, 120),
    customerEmail: z.string().email().max(180).transform((value) => value.trim().toLowerCase()),
    customerPhone: text(6, 40),
    deliveryMethod: z.enum(["HOME_DELIVERY", "STORE_PICKUP"]),
    address: z.string().max(220).optional().default("").transform(sanitizeText),
    city: z.string().max(120).optional().default("").transform(sanitizeText),
    zip: z.string().max(40).optional().default("").transform(sanitizeText),
    notes: z.string().max(500).optional().default("").transform(sanitizeText),
    items: z.array(cartItemSchema).min(1)
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "HOME_DELIVERY") {
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Address is required for home delivery."
        });
      }

      if (!data.city) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["city"],
          message: "City is required for home delivery."
        });
      }
    }
  });

const perfumeNoteSchema = z.object({
  name: text(1, 100),
  icon: z.string().min(1).max(500)
});

export const productSchema = z.object({
  name: text(2, 140),
  description: z.string().min(10).max(4000).transform((value) => sanitizeText(value)),
  categoryId: z.string().min(1),
  visualCategoryId: z.string().optional().nullable(),
  status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  offerType: z.enum(["PERCENTAGE", "FIXED"]).optional().nullable(),
  offerValue: z.coerce.number().positive().max(99999).optional().nullable(),
  offerStart: z.string().max(40).optional().nullable(),
  offerEnd: z.string().max(40).optional().nullable(),
  images: z.array(z.string().min(1)).max(16).default([]),
  videos: z.array(z.string().min(1)).max(8).default([]),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  topNotes: z.array(perfumeNoteSchema).max(10).default([]),
  heartNotes: z.array(perfumeNoteSchema).max(10).default([]),
  baseNotes: z.array(perfumeNoteSchema).max(10).default([]),
  accords: z.array(z.object({
    name: z.string().min(1),
    value: z.coerce.number().min(0).max(100)
  })).max(20).default([]),
  type: z.enum(["PERFUME", "REGULAR"]).default("PERFUME"),
  pageIds: z.array(z.string().min(1)).max(50).default([]),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: text(1, 80),
        price: z.coerce.number().positive().max(99999),
        stock: z.coerce.number().int().min(0).max(100000),
        isDefault: z.boolean().default(false)
      })
    )
    .min(1)
    .max(20)
}).superRefine((data, ctx) => {
  const hasOffer = data.offerType || data.offerValue || data.offerStart || data.offerEnd;

  if (!hasOffer) {
    return;
  }

  if (!data.offerType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["offerType"],
      message: "Choose an offer type."
    });
  }

  if (!data.offerValue || data.offerValue <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["offerValue"],
      message: "Enter a discount value."
    });
  }

  if (data.offerType === "PERCENTAGE" && data.offerValue && data.offerValue > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["offerValue"],
      message: "Percentage discounts cannot exceed 100%."
    });
  }

  if (data.offerStart && data.offerEnd && new Date(data.offerStart) > new Date(data.offerEnd)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["offerEnd"],
      message: "Offer end date must be after the start date."
    });
  }
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional()
});

export const orderBulkSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1).max(200),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional()
}).refine((data) => data.status || data.paymentStatus, {
  message: "Choose at least one bulk action."
});

export const categorySchema = z.object({
  name: text(2, 80)
});

export const visualCategorySchema = z.object({
  name: text(2, 80),
  parentId: z.string().optional().nullable(),
  image: z.string().optional().nullable()
});

export const pageSchema = z.object({
  title: text(2, 140),
  slug: z.string().max(160).optional().default("").transform(sanitizeText),
  excerpt: z.string().max(240).optional().default("").transform(sanitizeText),
  content: z.string().min(10).max(12000).transform((value) => sanitizeText(value)),
  published: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  menuLabel: z.string().max(80).optional().default("").transform(sanitizeText),
  visualCategoryId: z.string().optional().nullable(),
  collectionImage: z.string().optional().nullable(),
  productIds: z.array(z.string().min(1)).max(100).default([])
});

export const menuItemSchema = z
  .object({
    label: text(1, 80),
    href: z.string().max(500).optional().default("").transform(sanitizeText),
    type: z.enum(["INTERNAL", "PAGE", "EXTERNAL"]),
    visible: z.boolean().default(true),
    pageId: z.string().optional().nullable()
  })
  .superRefine((data, ctx) => {
    if (data.type === "PAGE" && !data.pageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pageId"],
        message: "Choose a page for page menu links."
      });
    }

    if (data.type !== "PAGE" && !data.href) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["href"],
        message: "Enter a URL for this menu item."
      });
    }
  });

export const menuReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1)
});

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(200)
});
