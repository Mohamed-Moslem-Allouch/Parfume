import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/format";

export async function createUniqueProductSlug(name: string, ignoreId?: string) {
  const base = slugify(name) || "product";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function createUniqueCategorySlug(name: string, ignoreId?: string) {
  const base = slugify(name) || "category";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function createUniqueVisualCategorySlug(name: string, ignoreId?: string) {
  const base = slugify(name) || "collection";
  let slug = base;
  let counter = 2;

  if (!(prisma as any).visualCategory) return slug; // Fallback if model doesn't exist

  while (true) {
    const existing = await (prisma as any).visualCategory.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}

export async function createUniquePageSlug(titleOrSlug: string, ignoreId?: string) {
  const base = slugify(titleOrSlug) || "page";
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.page.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!existing || existing.id === ignoreId) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}
