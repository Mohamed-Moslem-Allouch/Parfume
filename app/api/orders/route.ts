import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { createOrderNumber, toNumber } from "@/lib/format";
import { serializeOrder } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { sendOrderEmails } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { getOfferPrice } from "@/lib/offers";
import { storeConfig } from "@/lib/store";
import { ORDER_STATUSES } from "@/lib/status";
import { checkoutSchema } from "@/lib/validators";

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status");
  const orders = await prisma.order.findMany({
    where: status && ORDER_STATUSES.includes(status as any)
      ? { status }
      : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return NextResponse.json({ orders: orders.map(serializeOrder) });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = checkRateLimit(`checkout:${ip}`, 8, 10 * 60 * 1000);

  if (!limit.allowed) {
    return rateLimitResponse(limit.resetAt);
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid checkout data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const uniqueItems = Array.from(
    parsed.data.items
      .reduce((map, item) => {
        map.set(item.variantId, {
          productId: item.productId,
          variantId: item.variantId,
          quantity: (map.get(item.variantId)?.quantity || 0) + item.quantity
        });
        return map;
      }, new Map<string, { productId: string; variantId: string; quantity: number }>())
      .values()
  );

  try {
    const order = await prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { id: { in: uniqueItems.map((item) => item.variantId) } },
        include: { product: true }
      });

      if (variants.length !== uniqueItems.length) {
        throw new Error("One or more products are no longer available.");
      }

      const lineItems = uniqueItems.map((item) => {
        const variant = variants.find((candidate) => candidate.id === item.variantId);

        if (!variant || variant.productId !== item.productId) {
          throw new Error("A product option is missing.");
        }

        if ((variant.product as any).status !== "ACTIVE") {
          throw new Error(`${variant.product.name} is not available for sale.`);
        }

        if (variant.stock < item.quantity) {
          throw new Error(`${variant.product.name} ${variant.name} does not have enough stock.`);
        }

        const unitPrice = getOfferPrice(toNumber(variant.price), variant.product as any);

        return {
          product: variant.product,
          variant,
          quantity: item.quantity,
          unitPrice,
          lineTotal: unitPrice * item.quantity
        };
      });

      for (const item of lineItems) {
        const updatedVariant = await tx.productVariant.updateMany({
          where: {
            id: item.variant.id,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (updatedVariant.count !== 1) {
          throw new Error(`${item.product.name} ${item.variant.name} stock changed. Please review your cart.`);
        }

        await tx.product.update({
          where: { id: item.product.id },
          data: {
            stock: { decrement: item.quantity }
          }
        });
      }

      const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      const deliveryFee = parsed.data.deliveryMethod === "HOME_DELIVERY" ? storeConfig.deliveryFee : 0;
      const total = subtotal + deliveryFee;

      return tx.order.create({
        data: {
          orderNumber: createOrderNumber(),
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerPhone: parsed.data.customerPhone,
          deliveryMethod: parsed.data.deliveryMethod,
          address: parsed.data.deliveryMethod === "HOME_DELIVERY" ? parsed.data.address : null,
          city: parsed.data.deliveryMethod === "HOME_DELIVERY" ? parsed.data.city : null,
          zip: parsed.data.deliveryMethod === "HOME_DELIVERY" ? parsed.data.zip || null : null,
          notes: parsed.data.notes || null,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: parsed.data.deliveryMethod === "STORE_PICKUP" ? "STORE_PICKUP" : "PAY_ON_DELIVERY",
          paymentStatus: "UNPAID",
          items: {
            create: lineItems.map((item) => ({
              productId: item.product.id,
              productVariantId: item.variant.id,
              productName: item.product.name,
              variantName: item.variant.name,
              productImage: (typeof item.product.images === "string" ? JSON.parse(item.product.images) : item.product.images)[0] || null,
              productPrice: item.unitPrice,
              quantity: item.quantity
            }))
          }
        },
        include: { items: true }
      });
    });

    const emailOrder = {
      ...serializeOrder(order),
      deliveryMethod: order.deliveryMethod as "HOME_DELIVERY" | "STORE_PICKUP",
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        productName: item.productName,
        variantName: item.variantName,
        productPrice: toNumber(item.productPrice),
        quantity: item.quantity
      }))
    };

    const emailSent = await sendOrderEmails(emailOrder);
    await createNotification({
      type: "ORDER",
      title: "New order received",
      message: `${order.orderNumber} from ${order.customerName}`,
      href: `/admin/orders/${order.id}`
    });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      emailSent
    });
  } catch (error) {
    console.error("Order creation failed", error);

    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to create order."
      },
      { status: 400 }
    );
  }
}
