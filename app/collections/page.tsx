import { prisma } from "@/lib/prisma";
import { HierarchicalCategoryBrowser } from "@/components/hierarchical-category-browser";
import { toNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

function getFirstImage(images: string) {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) && parsed[0] ? parsed[0] : "/placeholder.webp";
  } catch {
    return "/placeholder.webp";
  }
}

function getProductImages(images: string) {
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type CollectionsPageProps = {
  searchParams?: Promise<{
    collection?: string;
  }>;
};

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialCategoryId = params?.collection || null;
  const [categories, products] = await Promise.all([
    (prisma as any).visualCategory 
      ? prisma.visualCategory.findMany({
          include: {
            pages: {
              where: { published: true },
              select: { id: true, title: true, slug: true, collectionImage: true }
            }
          },
          orderBy: { name: "asc" }
        })
      : Promise.resolve([]),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      take: 240,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        type: true,
        visualCategoryId: true
      }
    })
  ]);

  const serializedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: toNumber(p.price),
    image: getFirstImage(p.images),
    type: p.type,
    visualCategoryId: p.visualCategoryId || null,
    images: getProductImages(p.images)
  }));

  return (
    <div className="pt-20">
      <div className="section-shell mt-12 mb-8">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Curation</p>
        <h1 className="mt-3 font-heading text-4xl text-mist md:text-6xl">Explore our Collections</h1>
        <p className="mt-4 max-w-2xl text-muted text-lg">
          Discover our curated selection of fragrances, from inspired scents to exclusive niche collections. 
          Navigate through our hierarchy to find your perfect match.
        </p>
      </div>
      
      <HierarchicalCategoryBrowser 
        categories={categories} 
        allProducts={serializedProducts}
        initialCategoryId={initialCategoryId}
      />
    </div>
  );
}
