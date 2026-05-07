import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createUniqueCategorySlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validators";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = categorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid category data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug: await createUniqueCategorySlug(parsed.data.name)
    }
  });

  return NextResponse.json({ category }, { status: 201 });
}
