import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeText } from "@/lib/validators";

const accountSchema = z.object({
  name: z.string().min(2).max(120).transform(sanitizeText),
  email: z.string().email().max(180).transform((value) => value.trim().toLowerCase()),
  currentPassword: z.string().max(200).optional().default(""),
  newPassword: z.string().min(8).max(200).optional().or(z.literal(""))
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid account data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const data: { name: string; email: string; password?: string } = {
    name: parsed.data.name,
    email: parsed.data.email
  };

  if (parsed.data.newPassword) {
    if (!parsed.data.currentPassword) {
      return NextResponse.json({ message: "Current password is required to change password." }, { status: 400 });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);

    if (!valid) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
    }

    data.password = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, name: true, email: true }
  });

  return NextResponse.json({ user: updated });
}
