import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createUniqueVisualCategorySlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { visualCategorySchema } from "@/lib/validators";

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

  const parsed = visualCategorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid category data", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (!(prisma as any).visualCategory) {
      return NextResponse.json({ message: "Database syncing..." }, { status: 503 });
    }

    const category = await (prisma as any).visualCategory.update({
      where: { id },
      data: {
        name: parsed.data.name,
        slug: await createUniqueVisualCategorySlug(parsed.data.name, id),
        parentId: parsed.data.parentId || null,
        image: parsed.data.image || null
      }
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating visual category:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.count({
    where: { visualCategoryId: id }
  });

  if (products > 0) {
    return NextResponse.json({ message: "Move or delete products in this collection first." }, { status: 400 });
  }

  await prisma.visualCategory.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
