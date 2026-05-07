import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageForm } from "@/components/admin/page-form";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

type EditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function parseProductImages(images: string) {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export default async function EditPagePage({ params }: EditPageProps) {
  const { id } = await params;
  await requireAdmin();

  const [page, products, visualCategories] = await Promise.all([
    prisma.page.findUnique({
      where: { id },
      include: {
        products: {
          select: { id: true }
        },
        menuItems: {
          select: { id: true, label: true, visible: true },
          orderBy: { position: "asc" }
        }
      }
    }),
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

  if (!page) {
    notFound();
  }

  const safeProducts = products.map((product) => ({
    ...product,
    images: parseProductImages(product.images)
  }));

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Custom pages</p>
          <h1 className="mt-3 font-heading text-4xl text-mist">Edit {page.title}</h1>
        </div>
        <Link href="/admin/pages" className="btn-secondary w-fit">
          Back to Pages
        </Link>
      </div>
      <PageForm products={safeProducts as any} page={page as any} visualCategories={visualCategories} />
    </AdminShell>
  );
}
