import { CreditCard, Package, ReceiptText, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatusWidgetGrid } from "@/components/admin/status-widget-grid";
import { formatCurrency, toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function EcommercePage() {
  await requireAdmin();

  const [orders, statusCounts, paymentCounts] = await Promise.all([
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 1000
    }),
    prisma.order.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.order.groupBy({ by: ["paymentStatus"], _count: { paymentStatus: true } })
  ]);

  const completedOrders = orders.filter((order) => order.status !== "CANCELED");
  const revenue = completedOrders.reduce((sum, order) => sum + toNumber(order.total), 0);
  const unitsSold = completedOrders.flatMap((order) => order.items).reduce((sum, item) => sum + item.quantity, 0);
  const averageOrder = completedOrders.length ? revenue / completedOrders.length : 0;
  const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

  for (const order of completedOrders) {
    for (const item of order.items) {
      const key = item.productName;
      const current = productMap.get(key) || { name: item.productName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += toNumber(item.productPrice) * item.quantity;
      productMap.set(key, current);
    }
  }

  const bestSellers = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">E-Commerce</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Sales performance</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Revenue", value: formatCurrency(revenue), icon: TrendingUp },
          { label: "Orders", value: completedOrders.length, icon: ReceiptText },
          { label: "Units sold", value: unitsSold, icon: Package },
          { label: "Average order", value: formatCurrency(averageOrder), icon: CreditCard }
        ].map((metric) => (
          <section key={metric.label} className="rounded-md border border-white/10 bg-obsidian p-5">
            <metric.icon className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-mist">{metric.value}</p>
          </section>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-md border border-white/10 bg-obsidian">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-heading text-2xl text-mist">Best-selling products</h2>
          </div>
          <div className="divide-y divide-white/10">
            {bestSellers.map((product, index) => (
              <article key={product.name} className="grid gap-3 p-5 sm:grid-cols-[36px_1fr_auto] sm:items-center">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/10 text-sm font-bold text-gold">{index + 1}</span>
                <p className="font-medium text-mist">{product.name}</p>
                <div className="text-sm text-muted sm:text-right">
                  <p><strong className="text-gold">{product.quantity}</strong> units</p>
                  <p>{formatCurrency(product.revenue)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5">
          <StatusWidgetGrid
            title="Order Status"
            items={ORDER_STATUSES.map((status) => ({
              status,
              count: statusCounts.find((item) => item.status === status)?._count.status || 0
            }))}
          />
          <StatusWidgetGrid
            title="Payments"
            type="payment"
            items={PAYMENT_STATUSES.map((status) => ({
              status,
              count: paymentCounts.find((item) => item.paymentStatus === status)?._count.paymentStatus || 0
            }))}
          />
        </section>
      </div>
    </AdminShell>
  );
}
