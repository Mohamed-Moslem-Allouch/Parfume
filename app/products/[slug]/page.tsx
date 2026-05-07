import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductActions } from "@/components/product-actions";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { serializeProduct } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/format";
import { PerfumePyramid } from "@/components/perfume-pyramid";
import { MainAccords } from "@/components/main-accords";

export const dynamic = "force-dynamic";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { name: true, description: true }
  });

  if (!product) {
    return {
      title: "Product"
    };
  }

  return {
    title: product.name,
    description: product.description
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      category: true,
      variants: true,
      pages: {
        select: { id: true, title: true, slug: true }
      }
    }
  });

  if (!product) {
    notFound();
  }

  const serialized = serializeProduct(product as any);
  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      status: "ACTIVE"
    },
    include: {
      category: true,
      variants: true,
      pages: {
        select: { id: true, title: true, slug: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 4
  });

  return (
    <div className="section-shell py-12">
      <div className="grid gap-10 lg:grid-cols-[.95fr_1fr]">
        <ProductGallery images={serialized.images} videos={serialized.videos} name={serialized.name} />
        <div className="lg:pt-6">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">{serialized.category.name}</p>
          <h1 className="mt-3 font-heading text-4xl text-mist md:text-6xl">{serialized.name}</h1>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-bold text-gold">{formatCurrency(serialized.price)}</p>
            {serialized.offer?.active && serialized.originalPrice > serialized.price ? (
              <p className="pb-1 text-lg text-muted line-through">{formatCurrency(serialized.originalPrice)}</p>
            ) : null}
          </div>
          <p className="mt-6 max-w-2xl leading-8 text-muted">{serialized.description}</p>
          <ProductActions product={serialized} />
          
          {serialized.type === "PERFUME" && (
            <div className="mt-12 border-t border-white/5 pt-12">
              <MainAccords accords={serialized.accords} />
            </div>
          )}
        </div>
      </div>
      
      {serialized.type === "PERFUME" && (
        <PerfumePyramid
          topNotes={serialized.topNotes}
          heartNotes={serialized.heartNotes}
          baseNotes={serialized.baseNotes}
        />
      )}

      {related.length ? (
        <section className="mt-20">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Related products</p>
            <h2 className="mt-3 font-heading text-4xl text-mist">You may also like</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={serializeProduct(item as any)} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
