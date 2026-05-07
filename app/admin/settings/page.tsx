import { AdminShell } from "@/components/admin/admin-shell";
import { SettingsForm } from "@/components/admin/settings-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true }
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Settings</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Account and appearance</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Manage your admin account, dashboard preferences, and the look and feel of your workspace.
        </p>
      </div>
      <SettingsForm account={{ name: user?.name || "Admin", email: user?.email || session.user.email || "" }} />
    </AdminShell>
  );
}
