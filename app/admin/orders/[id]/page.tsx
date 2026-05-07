import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusSelect } from "@/components/admin/status-select";
import { InvoiceView } from "@/components/admin/invoice-view";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    notFound();
  }

  // Convert decimal to number for passing to client components to avoid warning
  const safeOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      productPrice: Number(item.productPrice)
    }))
  };

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end no-print">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Order view</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Manage Order</h1>
          <p className="mt-2 text-muted">Update status or print invoice.</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-obsidian p-2 px-4">
            <span className="text-sm text-muted">Status:</span>
            <div className="w-40">
              <StatusSelect orderId={order.id} value={order.status} />
            </div>
          </div>
          <Link href="/admin/orders" className="btn-secondary whitespace-nowrap">
            Back to Orders
          </Link>
        </div>
      </div>

      <InvoiceView order={safeOrder as any} />
    </AdminShell>
  );
}
