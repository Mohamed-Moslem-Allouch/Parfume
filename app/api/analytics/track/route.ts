import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const analyticsEventSchema = z.object({
  visitorId: z.string().min(8).max(120),
  path: z.string().min(1).max(500),
  title: z.string().max(220).optional().nullable(),
  referrer: z.string().max(500).optional().nullable(),
  event: z.enum(["view", "heartbeat"]).default("view")
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = analyticsEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") || null;
  const now = new Date();

  await prisma.visitorSession.upsert({
    where: { visitorId: parsed.data.visitorId },
    create: {
      visitorId: parsed.data.visitorId,
      path: parsed.data.path,
      referrer: parsed.data.referrer || null,
      userAgent,
      firstSeenAt: now,
      lastSeenAt: now
    },
    update: {
      path: parsed.data.path,
      referrer: parsed.data.referrer || null,
      userAgent,
      lastSeenAt: now
    }
  });

  if (parsed.data.event === "view") {
    await prisma.pageView.create({
      data: {
        visitorId: parsed.data.visitorId,
        path: parsed.data.path,
        title: parsed.data.title || null,
        referrer: parsed.data.referrer || null,
        userAgent
      }
    });
  }

  return NextResponse.json({ ok: true });
}
