import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncEmailInbox } from "@/lib/inbox-email";
import { syncMetaInbox } from "@/lib/meta-inbox";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

async function upsertMessages(messages: {
  source?: string;
  externalId: string;
  threadId: string | null;
  sourceProfileId?: string | null;
  fromName: string | null;
  fromAddress: string | null;
  toAddress?: string | null;
  ccAddress?: string | null;
  replyTo?: string | null;
  avatarUrl?: string | null;
  subject: string | null;
  body: string;
  htmlBody?: string | null;
  rawHeaders?: string;
  blockedImages?: number;
  attachments?: string;
  lastMessageAt: Date;
}[]) {
  let created = 0;

  for (const message of messages) {
    const source = message.source || "EMAIL";
    const existing = await prisma.inboxMessage.findUnique({
      where: { source_externalId: { source, externalId: message.externalId } },
      select: { id: true }
    });

    await prisma.inboxMessage.upsert({
      where: { source_externalId: { source, externalId: message.externalId } },
      create: {
        source,
        externalId: message.externalId,
        threadId: message.threadId,
        sourceProfileId: message.sourceProfileId || null,
        fromName: message.fromName,
        fromAddress: message.fromAddress,
        toAddress: message.toAddress || null,
        ccAddress: message.ccAddress || null,
        replyTo: message.replyTo || null,
        avatarUrl: message.avatarUrl || null,
        subject: message.subject,
        body: message.body,
        htmlBody: message.htmlBody || null,
        rawHeaders: message.rawHeaders || "[]",
        blockedImages: message.blockedImages || 0,
        attachments: message.attachments || "[]",
        lastMessageAt: message.lastMessageAt
      },
      update: {
        threadId: message.threadId,
        sourceProfileId: message.sourceProfileId || null,
        fromName: message.fromName,
        fromAddress: message.fromAddress,
        toAddress: message.toAddress || null,
        ccAddress: message.ccAddress || null,
        replyTo: message.replyTo || null,
        avatarUrl: message.avatarUrl || null,
        subject: message.subject,
        body: message.body,
        htmlBody: message.htmlBody || null,
        rawHeaders: message.rawHeaders || "[]",
        blockedImages: message.blockedImages || 0,
        attachments: message.attachments || "[]",
        lastMessageAt: message.lastMessageAt
      }
    });

    if (!existing) {
      created += 1;
    }
  }

  return created;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const channel = new URL(request.url).searchParams.get("channel") || "all";
  const results: string[] = [];
  const errors: string[] = [];
  let synced = 0;
  let created = 0;

  if (channel === "all" || channel === "email") {
    const result = await syncEmailInbox();
    if (result.ok) {
      synced += result.messages.length;
      created += await upsertMessages(result.messages);
      results.push(`Email: ${result.messages.length}`);
    } else {
      errors.push(result.error || "Email inbox sync failed.");
    }
  }

  if (channel === "all" || channel === "meta") {
    const result = await syncMetaInbox();
    if (result.ok) {
      synced += result.messages.length;
      created += await upsertMessages(result.messages);
      results.push(`Meta: ${result.messages.length}`);
      if (result.errors?.length) errors.push(...result.errors);
    } else {
      errors.push(result.error || "Meta inbox sync failed.");
    }
  }

  if (created > 0) {
    await createNotification({
      type: "INBOX",
      title: "New inbox messages",
      message: `${created} new email message${created === 1 ? "" : "s"} synced.`,
      href: "/admin/inbox"
    });
  }

  if (!results.length && errors.length) {
    return NextResponse.json({ message: errors.join(" "), errors }, { status: 400 });
  }

  return NextResponse.json({ synced, created, results, errors });
}
