import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { serializeProduct } from "@/lib/mappers";
import { prisma } from "@/lib/prisma";
import { createUniqueProductSlug } from "@/lib/products";
import { productSchema } from "@/lib/validators";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
      pages: {
        select: { id: true, title: true, slug: true }
      }
    }
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product: serializeProduct(product as any) });
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid product data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const slug = await createUniqueProductSlug(parsed.data.name, id);

  const defaultIndex = Math.max(0, parsed.data.variants.findIndex((variant) => variant.isDefault));
  const price = Math.min(...parsed.data.variants.map((variant) => variant.price));
  const stock = parsed.data.variants.reduce((sum, variant) => sum + variant.stock, 0);

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      images: JSON.stringify(parsed.data.images),
      videos: JSON.stringify(parsed.data.videos),
      status: parsed.data.status,
      offerType: parsed.data.offerType || null,
      offerValue: parsed.data.offerValue || null,
      offerStart: parsed.data.offerStart ? new Date(parsed.data.offerStart) : null,
      offerEnd: parsed.data.offerEnd ? new Date(parsed.data.offerEnd) : null,
      featured: parsed.data.featured,
      bestSeller: parsed.data.bestSeller,
      isNew: parsed.data.isNew,
      topNotes: JSON.stringify(parsed.data.topNotes),
      heartNotes: JSON.stringify(parsed.data.heartNotes),
      baseNotes: JSON.stringify(parsed.data.baseNotes),
      accords: JSON.stringify(parsed.data.accords),
      type: parsed.data.type,
      visualCategoryId: parsed.data.visualCategoryId || null,
      price,
      stock,
      slug,
      variants: {
        deleteMany: {},
        create: parsed.data.variants.map((variant, index) => ({
          name: variant.name,
          price: variant.price,
          stock: variant.stock,
          isDefault: index === defaultIndex
        }))
      },
      pages: {
        set: parsed.data.pageIds.map((id) => ({ id }))
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

  return NextResponse.json({ product: serializeProduct(product as any) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
