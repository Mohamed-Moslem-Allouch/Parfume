import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();

  const [categories, visualCategories, pages] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    (prisma as any).visualCategory 
      ? prisma.visualCategory.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, parentId: true }
        })
      : Promise.resolve([]),
    prisma.page.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true }
    })
  ]);

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Products</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Add new product</h1>
        </div>
        <Link href="/admin/products" className="btn-secondary w-fit">
          Back to Products
        </Link>
      </div>
      <ProductForm categories={categories} visualCategories={visualCategories} pages={pages} />
    </AdminShell>
  );
}
