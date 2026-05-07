import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { storeConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

type ThankYouPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

export default async function ThankYouPage({ params }: ThankYouPageProps) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true }
  });

  if (!order) {
    notFound();
  }

  const delivery =
    order.deliveryMethod === "HOME_DELIVERY"
      ? [order.address, order.city, order.zip].filter(Boolean).join(", ")
      : storeConfig.address;

  return (
    <div className="section-shell py-12">
      <div className="mx-auto max-w-3xl rounded-md border border-gold/25 bg-obsidian p-6 text-center shadow-gold sm:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
        <p className="mt-6 text-sm uppercase tracking-[0.24em] text-gold">Thank you</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Your order has been placed</h1>
        <p className="mt-4 text-muted">We have sent you an email with the details.</p>
        <div className="mt-8 rounded-md border border-white/10 bg-midnight p-5 text-left">
          <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">Order number</p>
              <p className="font-heading text-2xl text-gold">{order.orderNumber}</p>
            </div>
            <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
          </div>
          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 text-sm">
                <span className="text-mist">
                  {item.productName}
                  {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity}
                </span>
                <span className="font-medium text-gold">{formatCurrency(Number(item.productPrice) * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-2 flex justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="mb-4 flex justify-between text-sm text-muted">
              <span>Delivery</span>
              <span>{formatCurrency(Number(order.deliveryFee))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-gold">{formatCurrency(Number(order.total))}</span>
            </div>
            <p className="mt-4 text-sm text-muted">
              {order.deliveryMethod === "HOME_DELIVERY" ? "Home delivery" : "Store pickup"}: {delivery}
            </p>
          </div>
        </div>
        <Link href="/shop" className="btn-primary mt-8">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
