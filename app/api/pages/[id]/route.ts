import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getNextMenuPosition } from "@/lib/menu";
import { createUniquePageSlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { pageSchema } from "@/lib/validators";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = pageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid page data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const [slug, existingMenuItem] = await Promise.all([
    createUniquePageSlug(parsed.data.slug || parsed.data.title, id),
    prisma.menuItem.findFirst({
      where: { pageId: id },
      orderBy: { position: "asc" }
    })
  ]);
  const nextMenuPosition = parsed.data.showInMenu && !existingMenuItem ? await getNextMenuPosition() : 0;

  const page = await prisma.$transaction(async (tx) => {
    const updated = await tx.page.update({
      where: { id },
      data: {
        title: parsed.data.title,
        slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        published: parsed.data.published,
        visualCategoryId: parsed.data.visualCategoryId || null,
        collectionImage: parsed.data.collectionImage || null,
        products: {
          set: parsed.data.productIds.map((id) => ({ id }))
        }
      }
    });

    if (parsed.data.showInMenu) {
      if (existingMenuItem) {
        await tx.menuItem.update({
          where: { id: existingMenuItem.id },
          data: {
            label: parsed.data.menuLabel || parsed.data.title,
            visible: true,
            type: "PAGE",
            pageId: id,
            href: null
          }
        });
        await tx.menuItem.updateMany({
          where: { pageId: id, NOT: { id: existingMenuItem.id } },
          data: { visible: false }
        });
      } else {
        await tx.menuItem.create({
          data: {
            label: parsed.data.menuLabel || parsed.data.title,
            type: "PAGE",
            pageId: id,
            visible: true,
            position: nextMenuPosition
          }
        });
      }
    } else {
      await tx.menuItem.updateMany({
        where: { pageId: id },
        data: {
          visible: false
        }
      });
    }

    return updated;
  });

  return NextResponse.json({ page });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.page.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
