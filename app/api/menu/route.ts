import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getNextMenuPosition, serializeMenuItem } from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import { menuItemSchema, menuReorderSchema } from "@/lib/validators";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET() {
  const items = await prisma.menuItem.findMany({
    where: { visible: true },
    include: {
      page: {
        select: { slug: true, published: true }
      }
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }]
  });

  return NextResponse.json({
    items: items.map(serializeMenuItem).filter(Boolean)
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = menuItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid menu item", errors: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      label: parsed.data.label,
      href: parsed.data.type === "PAGE" ? null : parsed.data.href,
      type: parsed.data.type,
      visible: parsed.data.visible,
      pageId: parsed.data.type === "PAGE" ? parsed.data.pageId : null,
      position: await getNextMenuPosition()
    },
    include: {
      page: {
        select: { slug: true, published: true }
      }
    }
  });

  return NextResponse.json({ item: serializeMenuItem(item) }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = menuReorderSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid menu order", errors: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.orderedIds.map((id, index) =>
      prisma.menuItem.update({
        where: { id },
        data: { position: index }
      })
    )
  );

  return NextResponse.json({ ok: true });
}
