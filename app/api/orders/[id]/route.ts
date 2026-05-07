import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { serializeOrder } from "@/lib/mappers";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { orderStatusSchema } from "@/lib/validators";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

async function assertAdmin() {
  const session = await getServerSession(authOptions);

  return Boolean(session?.user && session.user.role === "ADMIN");
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await assertAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order: serializeOrder(order) });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  if (!(await assertAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = orderStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid status", errors: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.paymentStatus ? { paymentStatus: parsed.data.paymentStatus } : {})
    },
    include: { items: true }
  });

  await createNotification({
    type: "ORDER",
    title: "Order updated",
    message: `${order.orderNumber} is now ${order.status.replace("_", " ").toLowerCase()}`,
    href: `/admin/orders/${order.id}`
  });

  return NextResponse.json({ order: serializeOrder(order) });
}
