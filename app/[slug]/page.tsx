import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ShopProductBrowser } from "@/components/shop-product-browser";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CmsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Reserved slugs that should NOT be caught by this route
const reservedSlugs = new Set([
  "shop", "cart", "checkout", "admin", "api", "products", "pages", "thank-you", "not-found"
]);

export async function generateMetadata({ params }: CmsPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (reservedSlugs.has(slug)) {
    return { title: "Page" };
  }

  const page = await prisma.page.findUnique({
    where: { slug },
    select: { title: true, excerpt: true }
  });

  return {
    title: page?.title || "Page",
    description: page?.excerpt || undefined
  };
}

export default async function CmsPage({ params }: CmsPageProps) {
  const { slug } = await params;
  if (reservedSlugs.has(slug)) {
    notFound();
  }

  const page = await prisma.page.findUnique({
    where: { slug },
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      published: true
    }
  });

  if (!page || !page.published) {
    notFound();
  }

  return (
    <div className="section-shell py-12">
      <div className="mb-8 grid gap-5 md:grid-cols-[1fr_180px] md:items-end">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Collection</p>
          <h1 className="mt-3 font-heading text-4xl text-mist md:text-6xl">{page.title}</h1>
          {page.excerpt ? <p className="mt-4 text-muted">{page.excerpt}</p> : null}
          {page.content ? <div className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-7 text-muted">{page.content}</div> : null}
        </div>
      </div>
      <ShopProductBrowser
        pageSlug={page.slug}
        emptyTitle="No products on this page"
        emptyText="Add products from the admin page editor, or clear your filters."
      />
    </div>
  );
}
