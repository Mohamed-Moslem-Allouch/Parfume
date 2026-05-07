import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryManager } from "@/components/admin/category-manager";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Categories</p>
        <h1 className="mt-3 font-heading text-4xl text-mist">Category management</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted">Add Oud, Floral, Woody, seasonal groups, or any category you want products to use.</p>
      </div>
      <CategoryManager categories={categories} />
    </AdminShell>
  );
}
