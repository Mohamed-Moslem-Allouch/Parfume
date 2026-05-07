import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const activeSince = new Date(Date.now() - 2 * 60 * 1000);
  const visitors = await prisma.visitorSession.findMany({
    where: { lastSeenAt: { gte: activeSince } },
    orderBy: { lastSeenAt: "desc" },
    take: 20
  });

  return NextResponse.json({
    count: visitors.length,
    visitors: visitors.map((visitor) => ({
      visitorId: visitor.visitorId,
      path: visitor.path,
      lastSeenAt: visitor.lastSeenAt.toISOString()
    }))
  });
}
