import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/product-form";
import { serializeProduct } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  await requireAdmin();

  const [product, categories, visualCategories, pages] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        pages: {
          select: { id: true, title: true, slug: true }
        }
      }
    }),
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

  if (!product) {
    notFound();
  }

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Products</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Edit {product.name}</h1>
        </div>
        <Link href="/admin/products" className="btn-secondary w-fit">
          Back to Products
        </Link>
      </div>
      <ProductForm categories={categories} visualCategories={visualCategories} pages={pages} product={serializeProduct(product as any)} />
    </AdminShell>
  );
}
