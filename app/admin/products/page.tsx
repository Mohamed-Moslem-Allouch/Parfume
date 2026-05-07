import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ProductManagementTable } from "@/components/admin/product-management-table";
import { toNumber } from "@/lib/format";
import { isOfferActive } from "@/lib/offers";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();

  const [products, categories, pages, visualCategories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        variants: {
          select: { id: true, name: true, stock: true },
          orderBy: { createdAt: "asc" }
        },
        pages: {
          select: { id: true, title: true, slug: true },
          orderBy: { title: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" }
    }),
    prisma.page.findMany({
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" }
    }),
    (prisma as any).visualCategory 
      ? prisma.visualCategory.findMany({
          select: { id: true, name: true, parentId: true },
          orderBy: { name: "asc" }
        })
      : Promise.resolve([])
  ]);

  const productRows = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: JSON.parse(product.images) as string[],
    price: toNumber(product.price),
    stock: product.stock,
    status: (product as any).status || "ACTIVE",
    featured: product.featured,
    offer: (product as any).offerType
      ? {
          active: isOfferActive(product as any),
          type: (product as any).offerType,
          value: Number((product as any).offerValue || 0),
          startsAt: (product as any).offerStart?.toISOString() || null,
          endsAt: (product as any).offerEnd?.toISOString() || null
        }
      : null,
    updatedAt: product.updatedAt.toISOString(),
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug
    },
    variants: product.variants,
    pages: product.pages
  }));

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Products</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Product management</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary w-fit">
          <Plus className="h-4 w-4" />
          Add New Product
        </Link>
      </div>
      <ProductManagementTable 
        products={productRows} 
        categories={categories} 
        pages={pages} 
        visualCategories={visualCategories} 
      />
    </AdminShell>
  );
}
