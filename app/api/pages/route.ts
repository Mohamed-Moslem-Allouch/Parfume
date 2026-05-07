import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getNextMenuPosition } from "@/lib/menu";
import { createUniquePageSlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { pageSchema } from "@/lib/validators";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET() {
  const pages = await prisma.page.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return NextResponse.json({ pages });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = pageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid page data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const slug = await createUniquePageSlug(parsed.data.slug || parsed.data.title);
  const nextMenuPosition = parsed.data.showInMenu ? await getNextMenuPosition() : 0;
  const page = await prisma.$transaction(async (tx) => {
    const created = await tx.page.create({
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        published: parsed.data.published,
        visualCategoryId: parsed.data.visualCategoryId || null,
        collectionImage: parsed.data.collectionImage || null,
        products: {
          connect: parsed.data.productIds.map((id) => ({ id }))
        }
      }
    });

    if (parsed.data.showInMenu) {
      await tx.menuItem.create({
        data: {
          label: parsed.data.menuLabel || parsed.data.title,
          type: "PAGE",
          pageId: created.id,
          visible: true,
          position: nextMenuPosition
        }
      });
    }

    return created;
  });

  return NextResponse.json({ page }, { status: 201 });
}
