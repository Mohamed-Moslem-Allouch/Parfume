import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendPlainEmail } from "@/lib/email";
import { sendMetaReply } from "@/lib/meta-inbox";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

const replySchema = z.object({
  body: z.string().min(1).max(4000)
});

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid reply" }, { status: 400 });
  }

  const message = await prisma.inboxMessage.findUnique({ where: { id } });

  if (!message) {
    return NextResponse.json({ message: "Message not found" }, { status: 404 });
  }

  if (message.source !== "EMAIL") {
    const sent = await sendMetaReply({
      source: message.source,
      sourceProfileId: message.sourceProfileId,
      body: parsed.data.body
    });

    const reply = await prisma.inboxReply.create({
      data: {
        messageId: message.id,
        body: parsed.data.body,
        channel: message.source,
        sent: sent.ok,
        error: sent.ok ? null : sent.error || "Unable to send Meta reply."
      }
    });

    await prisma.inboxMessage.update({
      where: { id: message.id },
      data: { status: sent.ok ? "OPEN" : message.status }
    });

    return NextResponse.json({ reply, sent: sent.ok, message: reply.error }, { status: sent.ok ? 200 : 400 });
  }

  if (!message.fromAddress) {
    return NextResponse.json({ message: "This email does not have a reply address." }, { status: 400 });
  }

  const sent = await sendPlainEmail({
    to: message.fromAddress,
    subject: message.subject?.startsWith("Re:") ? message.subject : `Re: ${message.subject || "Your message"}`,
    text: parsed.data.body
  });

  const reply = await prisma.inboxReply.create({
    data: {
      messageId: message.id,
      body: parsed.data.body,
      channel: "EMAIL",
      sent: sent.ok,
      error: sent.ok ? null : sent.error || "Unable to send reply."
    }
  });

  await prisma.inboxMessage.update({
    where: { id: message.id },
    data: { status: sent.ok ? "OPEN" : message.status }
  });

  return NextResponse.json({ reply, sent: sent.ok }, { status: sent.ok ? 200 : 400 });
}
