import Link from "next/link";
import { ArrowRight, Droplets, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { HeroParticles } from "@/components/hero-particles";
import { HierarchicalCategoryBrowser } from "@/components/hierarchical-category-browser";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { StoreMap } from "@/components/store-map";
import { serializeProduct } from "@/lib/mappers";
import { toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { storeConfig } from "@/lib/store";

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

export default async function HomePage() {
  const [featured, newArrivals, bestSellers, visualCategories, collectionProducts] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, status: "ACTIVE" },
      include: { category: true, variants: true, pages: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true, variants: true, pages: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: { bestSeller: true, status: "ACTIVE" },
      include: { category: true, variants: true, pages: { select: { id: true, title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
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
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        type: true,
        visualCategoryId: true
      },
      take: 240
    })
  ]);

  const featuredProducts = featured.map((p) => serializeProduct(p as any));
  const newProducts = newArrivals.map((p) => serializeProduct(p as any));
  const bestSellerProducts = bestSellers.map((p) => serializeProduct(p as any));
  const serializedCollectionProducts = collectionProducts.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: toNumber(product.price),
    image: getFirstImage(product.images),
    images: getProductImages(product.images),
    type: product.type,
    visualCategoryId: product.visualCategoryId || null
  }));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.12),transparent_32rem)]" />
        <div className="section-shell relative z-10 flex min-h-[calc(100vh-5rem)] items-center py-16">
          <div className="max-w-3xl">
            <Reveal>
              <p className="mb-5 inline-flex rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
                ✨ Beauty & Fragrance Store
              </p>
              <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl md:text-7xl" style={{ color: 'var(--text-heading)' }}>
                Discover the scent that leaves a <span className="gold-text">golden memory</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 md:text-lg" style={{ color: 'var(--text-secondary)' }}>
                Shop refined perfumes, body care, oils, shampoo, crème, and premium beauty products with store pickup or home delivery.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary">
                  Shop Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="#featured" className="btn-secondary">
                  Featured Products
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Collections */}
      {visualCategories.length > 0 && (
        <section className="py-14 md:py-20">
          <Reveal>
            <div className="section-shell">
              <p className="text-sm uppercase tracking-[0.24em] text-gold">Explore collection</p>
              <h2 className="mt-3 font-heading text-3xl md:text-5xl" style={{ color: 'var(--text-heading)' }}>Discover what is inside each collection</h2>
            </div>
          </Reveal>
          <HierarchicalCategoryBrowser categories={visualCategories} allProducts={serializedCollectionProducts} />
        </section>
      )}

      {/* Featured */}
      <section id="featured" className="section-shell py-14 md:py-20">
        <Reveal>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-gold">Featured products</p>
              <h2 className="mt-3 font-heading text-3xl md:text-5xl" style={{ color: 'var(--text-heading)' }}>Bestsellers with a quiet glow</h2>
            </div>
            <Link href="/shop" className="btn-secondary w-fit">
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {featuredProducts.map((product, index) => (
            <Reveal key={product.id} delay={index * 0.06}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="border-y py-14 md:py-20" style={{ backgroundColor: 'var(--stripe-bg)', borderColor: 'var(--stripe-border)' }}>
          <div className="section-shell">
            <Reveal>
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-gold">Just arrived</p>
                  <h2 className="mt-3 font-heading text-3xl md:text-5xl" style={{ color: 'var(--text-heading)' }}>New Arrivals</h2>
                </div>
                <Link href="/shop" className="btn-secondary w-fit">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {newProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.06}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellerProducts.length > 0 && (
        <section className="section-shell py-14 md:py-20">
          <Reveal>
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-gold">Most loved</p>
                <h2 className="mt-3 font-heading text-3xl md:text-5xl" style={{ color: 'var(--text-heading)' }}>Best Sellers</h2>
              </div>
              <Link href="/shop" className="btn-secondary w-fit">
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {bestSellerProducts.map((product, index) => (
              <Reveal key={product.id} delay={index * 0.06}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="border-y py-14 md:py-20" style={{ backgroundColor: 'var(--stripe-bg)', borderColor: 'var(--stripe-border)' }}>
        <div className="section-shell">
          <Reveal>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Why choose us</p>
            <h2 className="mt-3 max-w-3xl font-heading text-3xl md:text-5xl" style={{ color: 'var(--text-heading)' }}>
              Carefully selected products, handled with boutique-level care.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[
              { icon: Sparkles, title: "Curated selection", text: "Each product is selected for quality, character, and lasting appeal." },
              { icon: Droplets, title: "Premium quality", text: "From perfumes to skincare, we source only the finest ingredients." },
              { icon: ShieldCheck, title: "Secure platform", text: "Your orders and data are managed with care and protection." },
              { icon: Truck, title: "Flexible delivery", text: "Choose home delivery or store pickup during checkout." }
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 0.06}>
                <div className="h-full rounded-lg border p-5 transition hover:border-gold/50" style={{ backgroundColor: 'var(--feature-bg)', borderColor: 'var(--border)' }}>
                  <item.icon className="h-6 w-6 text-gold" />
                  <h3 className="mt-4 font-heading text-xl" style={{ color: 'var(--text-heading)' }}>{item.title}</h3>
                  <p className="mt-2 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Store Location + Map */}
      <section className="section-shell py-14 md:py-20">
        <Reveal>
          <div className="grid gap-6 overflow-hidden rounded-lg border border-gold/25 md:grid-cols-[1fr_1.1fr]" style={{ backgroundColor: 'var(--location-bg)' }}>
            <div className="p-6 md:p-8">
              <p className="text-sm uppercase tracking-[0.24em] text-gold">Store location</p>
              <h2 className="mt-3 font-heading text-3xl md:text-4xl" style={{ color: 'var(--text-heading)' }}>Visit our store</h2>
              <p className="mt-4 max-w-xl" style={{ color: 'var(--text-secondary)' }}>{storeConfig.address}</p>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{storeConfig.phone}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/checkout" className="btn-primary">
                  Plan Pickup
                </Link>
                <Link href="/shop" className="btn-secondary">
                  Browse First
                </Link>
              </div>
            </div>
            <div className="min-h-[280px] md:min-h-[340px]">
              <StoreMap />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
