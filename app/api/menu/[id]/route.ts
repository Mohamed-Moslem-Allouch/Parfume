import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { serializeMenuItem } from "@/lib/menu";
import { prisma } from "@/lib/prisma";
import { menuItemSchema } from "@/lib/validators";

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

  const parsed = menuItemSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid menu item", errors: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      label: parsed.data.label,
      href: parsed.data.type === "PAGE" ? null : parsed.data.href,
      type: parsed.data.type,
      visible: parsed.data.visible,
      pageId: parsed.data.type === "PAGE" ? parsed.data.pageId : null
    },
    include: {
      page: {
        select: { slug: true, published: true }
      }
    }
  });

  return NextResponse.json({ item: serializeMenuItem(item) });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await prisma.menuItem.delete({
    where: { id }
  });

  return NextResponse.json({ ok: true });
}
