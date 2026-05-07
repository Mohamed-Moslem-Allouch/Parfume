import { AdminShell } from "@/components/admin/admin-shell";
import { NotificationsPanel } from "@/components/admin/notifications-panel";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requireAdmin();

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Notifications</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Alerts and updates</h1>
      </div>
      <NotificationsPanel notifications={notifications.map((notification) => ({
        ...notification,
        createdAt: notification.createdAt.toISOString()
      }))} />
    </AdminShell>
  );
}
