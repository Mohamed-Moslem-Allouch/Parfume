import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { serializeProduct } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { createUniqueProductSlug } from "@/lib/products";
import { productSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "";
  const visualCategory = searchParams.get("visualCategory") || "";
  const sort = searchParams.get("sort") || "newest";
  const featured = searchParams.get("featured");
  const pageSlug = searchParams.get("pageSlug") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(24, Math.max(1, Number(searchParams.get("limit") || "12")));
  const skip = (page - 1) * limit;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } }
            ]
          }
        : {},
      category ? { category: { slug: category } } : {},
      visualCategory ? { visualCategoryId: visualCategory } : {},
      pageSlug ? { pages: { some: { slug: pageSlug, published: true } } } : {},
      featured === "true" ? { featured: true } : {},
      { status: "ACTIVE" }
    ]
  };

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        pages: {
          select: { id: true, title: true, slug: true }
        }
      },
      orderBy,
      skip,
      take: limit
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } })
  ]);

  return NextResponse.json({
    products: products.map((p) => serializeProduct(p as any)),
    categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit))
    }
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid product data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const slug = await createUniqueProductSlug(parsed.data.name);

  const defaultIndex = Math.max(0, parsed.data.variants.findIndex((variant) => variant.isDefault));
  const price = Math.min(...parsed.data.variants.map((variant) => variant.price));
  const stock = parsed.data.variants.reduce((sum, variant) => sum + variant.stock, 0);

  const product = await prisma.product.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      visualCategoryId: parsed.data.visualCategoryId || null,
      status: parsed.data.status,
      offerType: parsed.data.offerType || null,
      offerValue: parsed.data.offerValue || null,
      offerStart: parsed.data.offerStart ? new Date(parsed.data.offerStart) : null,
      offerEnd: parsed.data.offerEnd ? new Date(parsed.data.offerEnd) : null,
      images: JSON.stringify(parsed.data.images),
      videos: JSON.stringify(parsed.data.videos),
      featured: parsed.data.featured,
      bestSeller: parsed.data.bestSeller,
      isNew: parsed.data.isNew,
      topNotes: JSON.stringify(parsed.data.topNotes),
      heartNotes: JSON.stringify(parsed.data.heartNotes),
      baseNotes: JSON.stringify(parsed.data.baseNotes),
      accords: JSON.stringify(parsed.data.accords),
      type: parsed.data.type,
      price,
      stock,
      slug,
      variants: {
        create: parsed.data.variants.map((variant, index) => ({
          name: variant.name,
          price: variant.price,
          stock: variant.stock,
          isDefault: index === defaultIndex
        }))
      },
      pages: {
        connect: parsed.data.pageIds.map((id) => ({ id }))
      }
    },
    include: {
      category: true,
      variants: true,
      pages: {
        select: { id: true, title: true, slug: true }
      }
    }
  });

  return NextResponse.json({ product: serializeProduct(product as any) }, { status: 201 });
}
