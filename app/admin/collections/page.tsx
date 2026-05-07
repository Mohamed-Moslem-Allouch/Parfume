import { AdminShell } from "@/components/admin/admin-shell";
import { VisualCategoryManager } from "@/components/admin/visual-category-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  await requireAdmin();

  const categories = (prisma as any).visualCategory 
    ? await prisma.visualCategory.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true, children: true, pages: true }
          },
          pages: {
            select: {
              id: true,
              title: true,
              slug: true,
              published: true,
              _count: { select: { products: true } }
            },
            orderBy: { title: "asc" }
          }
        }
      })
    : [];

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Visual Hierarchy</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Collections & Image Cards</h1>
        <p className="mt-4 text-muted max-w-2xl">
          Manage the image-based category system. This system is independent of default categories 
          and is used for the &quot;Explore&quot; visual navigation.
        </p>
      </div>

      <VisualCategoryManager categories={categories} />
    </AdminShell>
  );
}
