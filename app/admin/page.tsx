import Link from "next/link";
import { ArrowRight, FileText, FolderTree, Package, ReceiptText, Sparkles, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { DashboardPersonalizer } from "@/components/admin/dashboard-personalizer";
import { LiveVisitorsCard } from "@/components/admin/live-visitors-card";
import { OrderManagementTable } from "@/components/admin/order-management-table";
import { StatusWidgetGrid } from "@/components/admin/status-widget-grid";
import { formatCurrency, toNumber } from "@/lib/format";
import { serializeOrder } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ORDER_STATUSES } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const activeSince = new Date(Date.now() - 2 * 60 * 1000);

  const [totalOrders, totalProducts, totalCategories, totalPages, newOrdersWeek, recentOrders, totals, statusCounts, activeVisitors, unreadNotifications] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.page.count(),
    prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true }
    }),
    prisma.order.findMany({
      select: { total: true }
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true }
    }),
    prisma.visitorSession.count({ where: { lastSeenAt: { gte: activeSince } } }),
    prisma.notification.count({ where: { read: false } })
  ]);

  const revenue = totals.reduce((sum, order) => sum + toNumber(order.total), 0);
  const averageOrder = totalOrders ? revenue / totalOrders : 0;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Admin dashboard</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Store overview</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary w-fit">
          Add Product
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total orders", value: totalOrders, icon: ReceiptText },
          { label: "Products", value: totalProducts, icon: Package },
          { label: "New this week", value: newOrdersWeek, icon: Sparkles },
          { label: "Revenue", value: formatCurrency(revenue), icon: TrendingUp }
        ].map((card) => (
          <div key={card.label} className="rounded-md border border-white/10 bg-obsidian p-5">
            <card.icon className="h-5 w-5 text-gold" />
            <p className="mt-4 text-sm text-muted">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-mist">{card.value}</p>
          </div>
        ))}
      </div>

      <DashboardPersonalizer />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr_.7fr]">
        <StatusWidgetGrid
          title="Order Status"
          items={ORDER_STATUSES.map((status) => ({
            status,
            count: statusCounts.find((item) => item.status === status)?._count.status || 0
          }))}
        />

        <section className="rounded-md border border-white/10 bg-obsidian p-5">
          <h2 className="font-heading text-2xl text-mist">Catalog controls</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { href: "/admin/products", label: "Products", value: totalProducts, icon: Package },
              { href: "/admin/categories", label: "Categories", value: totalCategories, icon: FolderTree },
              { href: "/admin/pages", label: "Pages", value: totalPages, icon: FileText }
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md border border-white/10 bg-midnight p-4 transition hover:border-gold/50">
                <item.icon className="h-5 w-5 text-gold" />
                <p className="mt-3 text-sm text-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-mist">{item.value}</p>
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm text-muted">Average order value: <span className="font-bold text-gold">{formatCurrency(averageOrder)}</span></p>
          <p className="mt-2 text-sm text-muted">Unread notifications: <span className="font-bold text-gold">{unreadNotifications}</span></p>
        </section>

        <LiveVisitorsCard initialCount={activeVisitors} />
      </div>

      <section className="mt-5 rounded-md border border-white/10 bg-obsidian">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <h2 className="font-heading text-2xl text-mist">Recent orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-medium text-gold">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <OrderManagementTable orders={recentOrders.map((order) => serializeOrder(order))} compact />
      </section>
    </AdminShell>
  );
}
