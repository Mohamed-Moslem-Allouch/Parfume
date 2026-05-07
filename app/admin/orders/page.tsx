import { AdminShell } from "@/components/admin/admin-shell";
import { OrderManagementTable } from "@/components/admin/order-management-table";
import { OrderStatusFilter } from "@/components/admin/order-status-filter";
import { serializeOrder } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/status";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status;
  const validStatus = status && ORDER_STATUSES.includes(status as any) ? status : undefined;

  const orders = await prisma.order.findMany({
    where: validStatus ? { status: validStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true }
  });

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Orders</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Order management</h1>
        </div>
        <OrderStatusFilter value={validStatus || "ALL"} />
      </div>
      <OrderManagementTable orders={orders.map((order) => serializeOrder(order))} />
    </AdminShell>
  );
}
