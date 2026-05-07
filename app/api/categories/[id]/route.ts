import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createUniqueCategorySlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

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

  const parsed = categorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid category data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: await createUniqueCategorySlug(parsed.data.name, id)
    }
  });

  return NextResponse.json({ category });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.count({
    where: { categoryId: id }
  });

  if (products > 0) {
    return NextResponse.json({ message: "Move or delete products in this category first." }, { status: 400 });
  }

  await prisma.category.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
