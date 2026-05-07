import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [orders, email, facebook, instagram, notifications] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    prisma.inboxMessage.count({ where: { source: "EMAIL", status: "UNREAD" } }),
    prisma.inboxMessage.count({ where: { source: "FACEBOOK", status: "UNREAD" } }),
    prisma.inboxMessage.count({ where: { source: "INSTAGRAM", status: "UNREAD" } }),
    prisma.notification.count({ where: { read: false } })
  ]);

  return NextResponse.json({
    orders,
    email,
    facebook,
    instagram,
    inbox: email + facebook + instagram,
    notifications
  });
}
