import { AdminShell } from "@/components/admin/admin-shell";
import { MenuManager } from "@/components/admin/menu-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  await requireAdmin();

  const [items, pages] = await Promise.all([
    prisma.menuItem.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
            published: true
          }
        }
      }
    }),
    prisma.page.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true
      }
    })
  ]);

  const menuItems = items.map((item) => ({
    ...item,
    type: item.type as "INTERNAL" | "PAGE" | "EXTERNAL"
  }));

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Navigation</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Menu builder</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">
          Control what appears in the storefront menu on desktop, Android, iPhone, and tablet screens.
        </p>
      </div>
      <MenuManager initialItems={menuItems} pages={pages} />
    </AdminShell>
  );
}
