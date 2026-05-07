import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageForm } from "@/components/admin/page-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

function parseProductImages(images: string) {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export default async function NewPagePage() {
  await requireAdmin();

  const [products, visualCategories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        images: true,
        category: {
          select: { name: true }
        },
        pages: {
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" }
        }
      }
    }),
    (prisma as any).visualCategory 
      ? prisma.visualCategory.findMany({
          select: { id: true, name: true, parentId: true },
          orderBy: { name: "asc" }
        })
      : Promise.resolve([])
  ]);

  const safeProducts = products.map((product) => ({
    ...product,
    images: parseProductImages(product.images)
  }));

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Custom pages</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Add page</h1>
        </div>
        <Link href="/admin/pages" className="btn-secondary w-fit">
          Back to Pages
        </Link>
      </div>
      <PageForm products={safeProducts as any} visualCategories={visualCategories} />
    </AdminShell>
  );
}
