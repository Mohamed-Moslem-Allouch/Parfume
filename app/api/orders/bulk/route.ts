import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { orderBulkSchema } from "@/lib/validators";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderBulkSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid bulk order action", errors: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.paymentStatus) data.paymentStatus = parsed.data.paymentStatus;

  const result = await prisma.order.updateMany({
    where: { id: { in: parsed.data.orderIds } },
    data
  });

  await createNotification({
    type: "ORDER",
    title: "Bulk order update",
    message: `${result.count} orders were updated.`,
    href: "/admin/orders"
  });

  return NextResponse.json({ updated: result.count });
}
