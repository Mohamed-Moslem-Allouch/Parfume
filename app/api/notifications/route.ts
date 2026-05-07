import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertAdmin() {
  const session = await getServerSession(authOptions);
  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });
  const unread = await prisma.notification.count({ where: { read: false } });

  return NextResponse.json({
    unread,
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString()
    }))
  });
}

export async function PATCH(request: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];

  await prisma.notification.updateMany({
    where: ids.length ? { id: { in: ids } } : {},
    data: { read: true }
  });

  return NextResponse.json({ ok: true });
}
