import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

const inboxStatusSchema = z.object({
  status: z.enum(["UNREAD", "OPEN", "ARCHIVED"])
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = inboxStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid inbox status" }, { status: 400 });
  }

  const message = await prisma.inboxMessage.update({
    where: { id },
    data: { status: parsed.data.status }
  });

  return NextResponse.json({ message });
}
