import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createUniqueVisualCategorySlug } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { visualCategorySchema } from "@/lib/validators";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET() {
  if (!(prisma as any).visualCategory) {
    return NextResponse.json({ categories: [] });
  }

  const categories = await prisma.visualCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true, children: true }
      }
    }
  });

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = visualCategorySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid category data", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (!(prisma as any).visualCategory) {
      return NextResponse.json({ message: "Database syncing in progress. Please try again later." }, { status: 503 });
    }

    const category = await (prisma as any).visualCategory.create({
      data: {
        name: parsed.data.name,
        slug: await createUniqueVisualCategorySlug(parsed.data.name),
        parentId: parsed.data.parentId || null,
        image: parsed.data.image || null
      }
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating visual category:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
